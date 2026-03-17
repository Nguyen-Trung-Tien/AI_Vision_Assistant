import os
import logging
from typing import Optional

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        # Read API key from environment variable (do not hardcode secrets)
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set in environment variables.")
            self.client = None
        else:
            # Use the new Google Gen AI SDK client
            self.client = genai.Client(api_key=self.api_key)
            # Use a current stable flash model; allow override via env
            self.model = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
            logger.info("Gemini Service initialized.")

    def ask_gemini_vision(self, image_bytes: bytes, question: str) -> Optional[str]:
        if not self.api_key or self.client is None:
            return "Chưa cấu hình API Key của Gemini."

        try:
            # Prepare image for Gemini (using raw bytes and mime_type)
            base_prompt = question if question else "Hãy mô tả bức ảnh này."
            prompt = (
                "Trả lời ngắn gọn 1-2 câu, không dùng markdown hay danh sách. "
                + base_prompt
            )
            logger.info(f"Asking Gemini: {prompt}")

            max_tokens = os.getenv("GEMINI_MAX_OUTPUT_TOKENS")
            config = None
            if max_tokens:
                try:
                    config = types.GenerateContentConfig(
                        max_output_tokens=int(max_tokens)
                    )
                except Exception:
                    config = None

            response = self.client.models.generate_content(
                model=self.model,
                contents=[
                    prompt,
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type="image/jpeg",
                    ),
                ],
                config=config,
            )
            
            if response.text:
                return response.text
            return "Không thể nhận diện hình ảnh này, vui lòng thử lại."
            
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return "Có lỗi xảy ra khi gọi Google Gemini API."
