import base64
import json
import os
import re
import time
import traceback

import cv2
import numpy as np

import pika
from dotenv import load_dotenv

from services.ai_service import AIService
from services.danger_detector import detect_dangers
from services.gemini_service import GeminiService
from services.translations import t, translate_label
from services.tts_cache import TTSCacheService
from services import smart_ocr

# TTS/state cache for continuous stream
continuous_tts_cache: dict[str, str] = {}
last_processed_seq_by_client: dict[str, int] = {}

load_dotenv()

RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@127.0.0.1:5672/')

MAX_RETRIES = 3
RETRY_HEADER = 'x-retry-count'


def sanitize_for_tts(text: str) -> str:
    if not text:
        return ''
    cleaned = text
    cleaned = re.sub(r'^\s{0,3}#{1,6}\s+', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'^\s*[-*+]\s+', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'^\s*\d+\.\s+', '', cleaned, flags=re.MULTILINE)
    cleaned = cleaned.replace('**', '')
    cleaned = cleaned.replace('*', '')
    cleaned = cleaned.replace('__', '')
    cleaned = cleaned.replace('_', '')
    cleaned = cleaned.replace('`', '')
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def _resize_continuous_frame(frame_data: str) -> str:
    clean_b64 = frame_data.split(',')[1] if ',' in frame_data else frame_data
    img_data = base64.b64decode(clean_b64)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        return frame_data

    resized = cv2.resize(img, (320, 320), interpolation=cv2.INTER_AREA)
    ok, buffer = cv2.imencode('.jpg', resized, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
    if not ok:
        return frame_data
    return base64.b64encode(buffer).decode('utf-8')


def _build_compact_continuous_text(ai_result: dict, danger_alerts: list, lang: str) -> tuple[str, str]:
    if danger_alerts:
        top = sorted(danger_alerts, key=lambda a: float(a.get('distance', 999)))[0]
        label = top.get('label', '')
        position = top.get('position', '')
        dist = top.get('distance')
        if lang == 'en':
            text = f'{label} {position}, {dist} meters.'
        else:
            text = f'{label} {position.lower()}, {dist} mét.'
        signature = f'danger:{label}:{position}:{round(float(dist), 1)}'
        return text, signature

    detections = ai_result.get('raw_detections', []) or []
    concise_items = []
    signature_parts = []

    sorted_detections = sorted(
        [d for d in detections if float(d.get('confidence', 0)) >= 0.35],
        key=lambda d: float(d.get('distance', 999)),
    )

    for det in sorted_detections[:2]:
        label_raw = det.get('label', '')
        label = translate_label(label_raw, lang)
        pos_raw = det.get('position', 'center')
        dist = det.get('distance')
        if dist is None:
            continue

        if pos_raw == 'left':
            pos_text = t('position_left', lang).lower()
        elif pos_raw == 'right':
            pos_text = t('position_right', lang).lower()
        else:
            pos_text = t('position_front', lang).lower()

        if lang == 'en':
            concise_items.append(f'{label} {pos_text}, {dist}m')
        else:
            concise_items.append(f'{label} {pos_text}, {dist}m')

        signature_parts.append(f'{label_raw}:{pos_raw}:{round(float(dist), 1)}')

    if concise_items:
        return '. '.join(concise_items) + '.', 'obj:' + '|'.join(signature_parts)

    fallback = sanitize_for_tts(ai_result.get('text', ''))
    if not fallback:
        return '', 'empty'
    short_fallback = fallback.split('.')[0].strip()
    if len(short_fallback) > 70:
        short_fallback = short_fallback[:70].rstrip() + '...'
    return short_fallback, f'fallback:{short_fallback}'


def _should_skip_stale_continuous(client_id: str, frame_seq: int) -> bool:
    if frame_seq <= 0:
        return False

    last_processed = last_processed_seq_by_client.get(client_id, 0)
    if frame_seq <= last_processed:
        return True

    return False


def on_message(channel, method, properties, body):
    headers = properties.headers or {}
    retry_count = int(headers.get(RETRY_HEADER, 0))

    try:
        message = json.loads(body.decode())
        data = message.get('data', message)

        client_id = data.get('clientId', 'Unknown')
        user_id = data.get('userId')
        task_type = data.get('taskType', 'UNKNOWN')
        original_task_type = data.get('originalTaskType', task_type)
        frame_data = data.get('frameData', '')
        question = data.get('question', '')
        lang = data.get('lang', 'vi')
        warning_m = data.get('warningDistanceM', 2.0)
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        priority = data.get('priority', 5)
        frame_seq = int(data.get('frameSeq') or data.get('frame_seq') or 0)

        print(
            f"[*] Task: Client={client_id} | Type={task_type} | Orig={original_task_type} | "
            f"Priority={priority} | Seq={frame_seq} | Retry={retry_count}"
        )

        if original_task_type == 'CONTINUOUS' and _should_skip_stale_continuous(client_id, frame_seq):
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        if original_task_type == 'CONTINUOUS' and frame_data:
            try:
                frame_data = _resize_continuous_frame(frame_data)
            except Exception as e:
                print(f'[Warning] Failed to resize continuous frame: {e}')

        if task_type == 'OCR':
            ai_result = AIService.process_ocr(frame_data, client_id=client_id, lang=lang)
        elif task_type == 'TEXT_OCR':
            ai_result = AIService.process_text_ocr(frame_data, client_id=client_id, lang=lang)
        elif task_type == 'CAPTION':
            ai_result = AIService.process_captioning(frame_data, client_id=client_id, lang=lang)
            detections = ai_result.get('raw_detections', [])
            ai_result['danger_alerts'] = detect_dangers(detections, threshold_m=warning_m, lang=lang)
        elif task_type == 'SMART_OCR':
            sub_mode = data.get('subMode', 'general')
            ai_result = smart_ocr.process(frame_data, sub_mode=sub_mode, lang=lang)
        elif task_type == 'visual_qa':
            gemini_service = GeminiService()
            image_bytes = base64.b64decode(frame_data.split(',')[1] if ',' in frame_data else frame_data)
            answer = gemini_service.ask_gemini_vision(image_bytes, question)
            ai_result = {
                'text': answer,
                'confidence_score': 1.0,
                'stable': True,
                'danger_alerts': [],
            }
        else:
            print(f'[!] Unknown task type: {task_type}')
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        final_text = ai_result.get('text', '') or ''
        danger_alerts = ai_result.get('danger_alerts', [])
        if danger_alerts:
            top_danger = danger_alerts[0]['message']
            final_text = top_danger

        audio_url = ''
        stable = ai_result.get('stable', False)

        if task_type != 'visual_qa':
            tts_text = sanitize_for_tts(final_text)

            if original_task_type == 'CONTINUOUS':
                compact_text, compact_signature = _build_compact_continuous_text(
                    ai_result,
                    danger_alerts,
                    lang,
                )
                last_signature = continuous_tts_cache.get(client_id, '')

                # Priority behavior: danger > new objects > general scene
                if compact_signature == last_signature and not danger_alerts:
                    tts_text = ''
                    stable = True
                else:
                    continuous_tts_cache[client_id] = compact_signature
                    tts_text = compact_text
                    final_text = compact_text or final_text

            if tts_text:
                audio_url = TTSCacheService.get_audio_url(tts_text, lang=lang)

        if original_task_type == 'CONTINUOUS' and frame_seq > 0:
            last_processed_seq_by_client[client_id] = max(
                frame_seq,
                last_processed_seq_by_client.get(client_id, 0),
            )

        result_payload = {
            'pattern': 'ai_results_queue',
            'data': {
                'clientId': client_id,
                'userId': user_id,
                'taskType': original_task_type,
                'frameSeq': frame_seq,
                'text': final_text,
                'confidence_score': ai_result.get('confidence_score', 0.0),
                'audio_url': audio_url,
                'stable': stable,
                'latitude': latitude,
                'longitude': longitude,
                'danger_alerts': danger_alerts,
            },
        }
        channel.basic_publish(
            exchange='',
            routing_key='ai_results_queue',
            body=json.dumps(result_payload),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json',
            ),
        )

        channel.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f'[Error] Processing message (retry {retry_count}/{MAX_RETRIES}): {e}')
        traceback.print_exc()

        if retry_count < MAX_RETRIES:
            new_headers = {**headers, RETRY_HEADER: retry_count + 1}
            delay = 2 ** retry_count
            channel.basic_publish(
                exchange='',
                routing_key=method.routing_key,
                body=body,
                properties=pika.BasicProperties(
                    headers=new_headers,
                    delivery_mode=2,
                ),
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
            print(f'[Retry] Queued retry {retry_count + 1}/{MAX_RETRIES} (delay {delay}s)')
            time.sleep(delay)
        else:
            print(f'[Fatal] Max retries ({MAX_RETRIES}) exceeded. Dropping message.')
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_consumer():
    print('[*] Connecting to RabbitMQ Server...')
    try:
        parameters = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        queue_name = 'ai_tasks_queue'
        channel.queue_declare(queue_name, durable=True)
        channel.queue_declare('ai_results_queue', durable=True)

        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue=queue_name, on_message_callback=on_message)

        print('[*] Waiting for AI tasks. To exit press CTRL+C')
        channel.start_consuming()
    except Exception as ex:
        print(f'[Fatal] RabbitMQ Connection Failed: {ex}')


if __name__ == '__main__':
    start_consumer()
