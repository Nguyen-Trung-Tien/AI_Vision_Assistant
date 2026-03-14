import os
import google.generativeai as genai
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("AIzaSyBAxCnoUikb9GyqY8-yjiC8M5xbXgPcizM")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set in environment variables.")
        else:
            genai.configure(api_key=self.api_key)
            # Use flash for speed
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("Gemini Service initialized.")

    def ask_gemini_vision(self, image_bytes: bytes, question: str) -> Optional[str]:
        if not self.api_key:
            return "Chưa cấu hình API Key của Gemini."

        try:
            # Prepare image for Gemini (using the raw bytes and mime_type)
            image_parts = [
                {
                    "mime_type": "image/jpeg",
                    "data": image_bytes
                }
            ]
            
            prompt = question if question else "Bức ảnh này có gì đặc biệt?"
            logger.info(f"Asking Gemini: {prompt}")

            response = self.model.generate_content([prompt, image_parts[0]])
            
            if response.text:
                return response.text
            return "Không thể nhận diện hình ảnh này, vui lòng thử lại."
            
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return "Có lỗi xảy ra khi gọi Google Gemini API."
