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
from services.face_recognition_service import FaceRecognitionService

# TTS/state cache for continuous stream
continuous_tts_cache: dict[str, str] = {}
last_processed_seq_by_client: dict[str, int] = {}

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@127.0.0.1:5672/")

MAX_RETRIES = 3
RETRY_HEADER = "x-retry-count"


def sanitize_for_tts(text: str) -> str:
    if not text:
        return ""
    cleaned = text
    cleaned = re.sub(r"^\s{0,3}#{1,6}\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*[-*+]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*\d+\.\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = cleaned.replace("**", "")
    cleaned = cleaned.replace("*", "")
    cleaned = cleaned.replace("__", "")
    cleaned = cleaned.replace("_", "")
    cleaned = cleaned.replace("`", "")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _resize_continuous_frame(frame_data: str) -> str:
    clean_b64 = frame_data.split(",")[1] if "," in frame_data else frame_data
    img_data = base64.b64decode(clean_b64)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        return frame_data

    resized = cv2.resize(img, (480, 480), interpolation=cv2.INTER_AREA)
    ok, buffer = cv2.imencode(".jpg", resized, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    if not ok:
        return frame_data
    return base64.b64encode(buffer).decode("utf-8")


def _build_compact_continuous_text(ai_result: dict, danger_alerts: list, lang: str) -> tuple[str, str]:
    if danger_alerts:
        top = sorted(danger_alerts, key=lambda a: float(a.get("distance", 999)))[0]
        label = top.get("label", "")
        position = top.get("position", "")
        dist = top.get("distance")
        if lang == "en":
            text = f"{label} {position}, {dist} meters."
        else:
            text = f"{label} {position.lower()}, {dist} mét."
        signature = f"danger:{label}:{position}:{round(float(dist), 1)}"
        return text, signature

    detections = ai_result.get("raw_detections", []) or []
    concise_items = []
    signature_parts = []

    sorted_detections = sorted(
        [d for d in detections if float(d.get("confidence", 0)) >= 0.15],
        key=lambda d: float(d.get("distance", 999)),
    )

    for det in sorted_detections[:5]:
        label_raw = det.get("label", "")
        label = translate_label(label_raw, lang)
        pos_raw = det.get("position", "center")
        dist = det.get("distance")
        if dist is None:
            continue

        if pos_raw == "left":
            pos_text = t("position_left", lang).lower()
        elif pos_raw == "right":
            pos_text = t("position_right", lang).lower()
        else:
            pos_text = t("position_front", lang).lower()

        if lang == "en":
            concise_items.append(f"{label} {pos_text}, {dist}m")
        else:
            concise_items.append(f"{label} {pos_text}, {dist}m")

        signature_parts.append(f"{label_raw}:{pos_raw}:{round(float(dist), 1)}")

    if concise_items:
        return ". ".join(concise_items) + ".", "obj:" + "|".join(signature_parts)

    fallback = sanitize_for_tts(ai_result.get("text", ""))
    if not fallback:
        return "", "empty"
    short_fallback = fallback.split(".")[0].strip()
    if len(short_fallback) > 70:
        short_fallback = short_fallback[:70].rstrip() + "..."
    return short_fallback, f"fallback:{short_fallback}"


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
        data = message.get("data", message)

        client_id = data.get("clientId", "Unknown")
        user_id = data.get("userId")
        name = data.get("name")
        task_type = data.get("taskType", "UNKNOWN")
        original_task_type = data.get("originalTaskType", task_type)
        frame_data = data.get("frameData", "")
        lang = data.get("lang", "vi")
        warning_m = data.get("warningDistanceM", 2.0)
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        priority = data.get("priority", 5)
        frame_seq = int(data.get("frameSeq") or data.get("frame_seq") or 0)
        is_front_camera = data.get("is_front_camera") or data.get("isFrontCamera") or False
        sub_mode = data.get("subMode") or data.get("sub_mode") or "general"

        print(
            f"[*] Task: Client={client_id} | Type={task_type} | Orig={original_task_type} | "
            f"Priority={priority} | Seq={frame_seq} | Retry={retry_count}"
        )

        if original_task_type == "CONTINUOUS" and _should_skip_stale_continuous(client_id, frame_seq):
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        if original_task_type == "CONTINUOUS" and frame_data:
            try:
                frame_data = _resize_continuous_frame(frame_data)

                # Handle Front Camera Mirroring
                if is_front_camera:
                    img_bytes = base64.b64decode(frame_data)
                    np_arr = np.frombuffer(img_bytes, np.uint8)
                    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                    if img is not None:
                        # 1 = Horizontal Flip
                        flipped = cv2.flip(img, 1)
                        _, buffer = cv2.imencode(".jpg", flipped, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
                        frame_data = base64.b64encode(buffer).decode("utf-8")
            except Exception as e:
                print(f"[Warning] Failed to process/flip continuous frame: {e}")

        if task_type == "OCR":
            ai_result = AIService.process_ocr(frame_data, client_id=client_id, lang=lang)
        elif task_type == "TEXT_OCR":
            ai_result = AIService.process_text_ocr(frame_data, client_id=client_id, lang=lang)
        elif task_type == "CAPTION":
            ai_result = AIService.process_captioning(frame_data, client_id=client_id, lang=lang)
            detections = ai_result.get("raw_detections", [])
            ai_result["danger_alerts"] = detect_dangers(detections, threshold_m=warning_m, lang=lang)
        elif task_type == "SMART_OCR":
            sub_mode = data.get("subMode", "general")
            ai_result = smart_ocr.process(frame_data, sub_mode=sub_mode, lang=lang)
        elif task_type == "FACE_RECOGNITION":
            # The payload should contain knownFaces: [{'name': '...', 'embedding': [...]}]
            known_faces_data = data.get("knownFaces", [])
            # Convert embedding lists back to numpy arrays
            known_faces = []
            for k in known_faces_data:
                known_faces.append({"name": k["name"], "embedding": np.array(k["embedding"], dtype=np.float32)})

            image_bytes = base64.b64decode(frame_data.split(",")[1] if "," in frame_data else frame_data)
            names = FaceRecognitionService.recognize_face(image_bytes, known_faces)
            print(f"[Face] Recognition result: {names}")

            if names:
                # Filter out 'unknown' if we want to be silent for them, or include them
                identified = [n for n in names if n != "unknown"]
                if identified:
                    names_text = ", ".join(identified)
                    if lang == "vi":
                        text = f"{names_text} đang đứng trước mặt bạn"
                    else:
                        text = f"{names_text} is standing in front of you"
                else:
                    text = ""  # Silent for unknown
            else:
                text = ""

            ai_result = {
                "text": text,
                "confidence_score": 1.0,
                "stable": True,
                "danger_alerts": [],
            }
        elif task_type == "GET_FACE_ENCODING":
            # Used for registration
            print(f"[Face] Extracting encoding for user: {user_id}, name: {name}")
            image_bytes = base64.b64decode(frame_data.split(",")[1] if "," in frame_data else frame_data)
            faces = FaceRecognitionService.get_face_embeddings(image_bytes)
            # Return the first face's embedding for registration
            if faces:
                print(f"[Face] Successfully detected {len(faces)} face(s). Using the first one.")
                encoding = faces[0]["embedding"].tolist()
                ai_result = {"text": "Face detected", "encoding": encoding, "name": name, "stable": True}
            else:
                print("[Face] Warning: No face detected in the provided image!")
                ai_result = {"text": "No face detected", "encoding": None, "name": name, "stable": True}
        elif task_type == "RELOAD_MODEL":
            print("[*] Reloading models as requested...")
            object_path = data.get("objectPath")
            money_path = data.get("moneyPath")
            reload_res = AIService.reload_models(object_path, money_path)
            ai_result = {
                "text": f'Models reloaded: {reload_res["object_model"]}',
                "status": "success",
                "details": reload_res,
                "stable": True,
            }
        elif task_type == "LAYOUT_ANALYSIS":
            print(f"[*] Processing Layout Analysis for client: {client_id}")
            image_bytes = base64.b64decode(frame_data.split(",")[1] if "," in frame_data else frame_data)
            gemini = GeminiService()
            result_text = gemini.analyze_layout(image_bytes, lang=lang)
            ai_result = {
                "text": result_text,
                "confidence_score": 1.0,
                "stable": True,
                "danger_alerts": [],
            }
        else:
            print(f"[!] Unknown task type: {task_type}")
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        # Logging for debugging accuracy
        if original_task_type == "CONTINUOUS":
            raw_dets = ai_result.get("raw_detections", [])
            task_seq = data.get("seq") or data.get("sequence") or "?"
            print(f"[DEBUG Continuous] Seq={task_seq}: Found {len(raw_dets)} objects (Threshold 0.10)", flush=True)
            for d in raw_dets[:3]:
                print(f"  - {d.get('label')}: {d.get('confidence', 0):.2f} at {d.get('distance', '?')}m", flush=True)

        final_text = ai_result.get("text", "") or ""
        danger_alerts = ai_result.get("danger_alerts", [])
        if danger_alerts:
            top_danger = danger_alerts[0]["message"]
            final_text = top_danger

        audio_url = ""
        stable = ai_result.get("stable", False)

        if task_type != "visual_qa":
            tts_text = sanitize_for_tts(final_text)

            if original_task_type == "CONTINUOUS":
                compact_text, compact_signature = _build_compact_continuous_text(
                    ai_result,
                    danger_alerts,
                    lang,
                )

                # Context Tuning: If Recognition Mode is active, we don't want to hear about trash cans
                if sub_mode == "recognition":
                    # Filter out non-person objects from the result text to avoid "trash can" annoyance
                    raw_dets = ai_result.get("raw_detections", [])
                    persons = [d for d in raw_dets if d.get("label") == "person"]

                    if not persons:
                        # If no person detected, be silent about obstacles in recognition mode
                        compact_text = ""
                        compact_signature = "recognition_silent"
                    else:
                        # If knownFaces are provided, try to identify who they are
                        known_faces_data = data.get("knownFaces", [])
                        if known_faces_data:
                            try:
                                # Convert embedding lists back to numpy arrays
                                known_faces = []
                                for k in known_faces_data:
                                    known_faces.append(
                                        {"name": k["name"], "embedding": np.array(k["embedding"], dtype=np.float32)}
                                    )

                                # We need the frame data (already decoded or base64)
                                image_bytes = base64.b64decode(
                                    frame_data.split(",")[1] if "," in frame_data else frame_data
                                )
                                names = FaceRecognitionService.recognize_face(image_bytes, known_faces)

                                identified = [n for n in names if n != "unknown"]
                                if identified:
                                    names_text = ", ".join(identified)
                                    compact_text = (
                                        f"Phát hiện {names_text} đang đứng trước mặt"
                                        if lang == "vi"
                                        else f"Detected {names_text} in front"
                                    )
                                    compact_signature = f"face:{':'.join(identified)}"
                                else:
                                    compact_text = t("person_detected", lang) if lang == "vi" else "Person detected"
                                    compact_signature = f"person:{len(persons)}"
                            except Exception as e:
                                print(f"[Error] Continuous recognition failed: {e}")
                                compact_text = t("person_detected", lang) if lang == "vi" else "Person detected"
                                compact_signature = f"person:{len(persons)}"
                        else:
                            # Keep only person info
                            compact_text = t("person_detected", lang) if lang == "vi" else "Person detected"
                            compact_signature = f"person:{len(persons)}"

                # Front Camera suppression for "Trash Can" misidentification
                if is_front_camera and "thung_rac" in compact_signature:
                    # If person is detected or confidence of trash can is low, skip it
                    raw_dets = ai_result.get("raw_detections", [])
                    has_person = any(d.get("label") == "person" for d in raw_dets)
                    if has_person:
                        compact_text = ""  # Suppress obstacle when person is there
                        compact_signature = "suppress_front_obstacle"

                last_signature = continuous_tts_cache.get(client_id, "")

                # Priority behavior: danger > new objects > general scene
                if danger_alerts:
                    # Always prioritize danger
                    tts_text = compact_text
                    final_text = compact_text
                elif compact_signature == last_signature:
                    # Skip repeated scene
                    tts_text = ""
                    stable = True
                else:
                    continuous_tts_cache[client_id] = compact_signature
                    # USE FULL TEXT instead of compact for "Full Detail" as requested
                    tts_text = final_text
                    final_text = final_text

            if tts_text:
                audio_url = TTSCacheService.get_audio_url(tts_text, lang=lang)

        if original_task_type == "CONTINUOUS" and frame_seq > 0:
            last_processed_seq_by_client[client_id] = max(
                frame_seq,
                last_processed_seq_by_client.get(client_id, 0),
            )

        result_payload = {
            "pattern": "ai_results_queue",
            "data": {
                "clientId": client_id,
                "userId": user_id,
                "taskType": original_task_type,
                "frameSeq": frame_seq,
                "text": final_text,
                "confidence_score": ai_result.get("confidence_score", 0.0),
                "audio_url": audio_url,
                "stable": stable,
                "latitude": latitude,
                "longitude": longitude,
                "danger_alerts": danger_alerts,
                "encoding": ai_result.get("encoding"),
                "name": ai_result.get("name"),
            },
        }
        channel.basic_publish(
            exchange="",
            routing_key="ai_results_queue",
            body=json.dumps(result_payload),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type="application/json",
            ),
        )

        channel.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f"[Error] Processing message (retry {retry_count}/{MAX_RETRIES}): {e}")
        traceback.print_exc()

        if retry_count < MAX_RETRIES:
            new_headers = {**headers, RETRY_HEADER: retry_count + 1}
            delay = 2**retry_count
            channel.basic_publish(
                exchange="",
                routing_key=method.routing_key,
                body=body,
                properties=pika.BasicProperties(
                    headers=new_headers,
                    delivery_mode=2,
                ),
            )
            channel.basic_ack(delivery_tag=method.delivery_tag)
            print(f"[Retry] Queued retry {retry_count + 1}/{MAX_RETRIES} (delay {delay}s)")
            time.sleep(delay)
        else:
            print(f"[Fatal] Max retries ({MAX_RETRIES}) exceeded. Dropping message.")
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_consumer():
    print("[*] Connecting to RabbitMQ Server...")
    try:
        parameters = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        queue_name = "ai_tasks_queue"
        channel.queue_declare(queue_name, durable=True)
        channel.queue_declare("ai_results_queue", durable=True)

        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue=queue_name, on_message_callback=on_message)

        print("[*] Waiting for AI tasks. To exit press CTRL+C")
        channel.start_consuming()
    except Exception as ex:
        print(f"[Fatal] RabbitMQ Connection Failed: {ex}")


if __name__ == "__main__":
    start_consumer()
