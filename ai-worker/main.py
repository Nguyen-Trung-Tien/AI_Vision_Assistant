import os
import threading

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="AI Vision Assistant - AI Worker",
    version="1.0"
)

# Mount TTS audio directory for static file serving
# Client/Gateway can request GET /audio/<filename>.mp3
from services.tts_cache import TTSCacheService
_audio_dir = TTSCacheService.get_audio_dir()
os.makedirs(_audio_dir, exist_ok=True)
app.mount("/audio", StaticFiles(directory=_audio_dir), name="audio")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-worker", "audio_dir": _audio_dir}

def _run_consumer():
    """Background thread: start RabbitMQ consumer."""
    from rabbitmq_consumer import start_consumer
    start_consumer()

if __name__ == "__main__":
    # Start RabbitMQ consumer in background thread
    consumer_thread = threading.Thread(target=_run_consumer, daemon=True)
    consumer_thread.start()

    # Start FastAPI for health check + static audio serving
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
