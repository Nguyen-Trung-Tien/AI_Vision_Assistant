from fastapi import FastAPI
import uvicorn
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="AI Vision Assistant - AI Worker",
    version="1.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-worker"}

if __name__ == "__main__":
    # Start the server for health check or testing purposes
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
