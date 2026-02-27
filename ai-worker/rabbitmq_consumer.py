import pika
import os
import json
from dotenv import load_dotenv

from services.ai_service import AIService
from services.tts_cache import TTSCacheService
from services.danger_detector import detect_dangers
from services.translations import t

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@127.0.0.1:5672/")

def apply_hallucination_guard(confidence: float, text: str, lang: str = "vi") -> str:
    """ Appends warning prefix if confidence is low """
    if confidence < 0.6:
        return t("maybe_blurry", lang, text=text)
    elif confidence < 0.85:
        return t("seems_like", lang, text=text)
    return text

def on_message(channel, method, properties, body):
    try:
        # Message format from NestJS: { "data": { clientId, taskType, frameData, timestamp } }
        message = json.loads(body.decode())
        
        # NestJS Microservices usually wrap inner data in a "data" object
        data = message.get("data", message)
        
        client_id = data.get("clientId", "Unknown")
        user_id = data.get("userId")
        task_type = data.get("taskType", "UNKNOWN")
        frame_data = data.get("frameData", "")
        lang = data.get("lang", "vi")
        warning_m = data.get("warningDistanceM", 2.0)
        
        print(f"[*] Received Task: Client={client_id} | Type={task_type} | Lang={lang} | WarningDist={warning_m}m")
        
        ai_result = {}
        if task_type == "OCR":
            ai_result = AIService.process_ocr(frame_data, client_id=client_id, lang=lang)
        elif task_type == "TEXT_OCR":
            ai_result = AIService.process_text_ocr(frame_data, client_id=client_id, lang=lang)
        elif task_type == "CAPTION":
            ai_result = AIService.process_captioning(frame_data, client_id=client_id, lang=lang)
            # Add danger detection for scene captioning
            detections = ai_result.get("raw_detections", [])
            danger_alerts = detect_dangers(detections, threshold_m=warning_m, lang=lang)
            ai_result["danger_alerts"] = danger_alerts
        else:
            print(f"[!] Unknown task type: {task_type}")
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return
            
        print(f"[AI Worker] Raw AI Result: {ai_result}")
        
        # Use text directly from AI Service
        final_text = ai_result['text']
        
        # Danger alerts injection
        danger_alerts = ai_result.get("danger_alerts", [])
        if danger_alerts:
            # Prepend the most critical danger warning
            top_danger = danger_alerts[0]["message"]
            final_text = f"{top_danger} {final_text}"
        
        # Post-Process: Get TTS Audio URL from Redis Cache
        audio_url = TTSCacheService.get_audio_url(final_text)
        
        # In a real app, emit RPC back. Here we just print the final composed response.
        print(f"[+] Task Completed! Final Result for Socket:")
        print(f"    - Text: {final_text}")
        print(f"    - Confidence: {ai_result['confidence_score']}")
        print(f"    - Dangers: {len(danger_alerts)}")
        print("-" * 50)
        # Publish result back to Gateway in NestJS Microservice format
        result_payload = {
            "pattern": "ai_results_queue",
            "data": {
                "clientId": client_id,
                "userId": user_id,
                "taskType": task_type,
                "text": final_text,
                "confidence_score": ai_result.get("confidence_score", 0.0),
                "audio_url": audio_url,
                "stable": ai_result.get("stable", False),
                "danger_alerts": danger_alerts
            }
        }
        channel.basic_publish(
            exchange='',
            routing_key='ai_results_queue',
            body=json.dumps(result_payload)
        )
        
        # Acknowledge the message so RabbitMQ removes it from Queue
        channel.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        print(f"[Error] Processing message: {e}")
        # Negative acknowledge, push to dead letter exchange or requeue
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def start_consumer():
    print("[*] Connecting to RabbitMQ Server...")
    try:
        parameters = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        # Ensure queues exist
        queue_name = 'ai_tasks_queue'
        channel.queue_declare(queue_name, durable=True)
        channel.queue_declare('ai_results_queue', durable=True)

        # QoS: Only take 1 message at a time to not overwhelm the GPU
        channel.basic_qos(prefetch_count=1)
        
        channel.basic_consume(queue=queue_name, on_message_callback=on_message)

        print("[*] Waiting for AI tasks. To exit press CTRL+C")
        channel.start_consuming()
    except Exception as ex:
        print(f"[Fatal] RabbitMQ Connection Failed: {ex}")

if __name__ == "__main__":
    start_consumer()
