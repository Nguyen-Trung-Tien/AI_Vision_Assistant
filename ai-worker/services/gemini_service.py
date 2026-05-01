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
            return "Có lỗi xảy ra khi gọi Gemini API."

    def analyze_layout(self, image_bytes: bytes, lang: str = "vi") -> Optional[str]:
        if not self.api_key or self.client is None:
            return "Chưa cấu hình API Key của Gemini."

        try:
            # Custom prompt for layout analysis (Menu, Book, Document)
            if lang == "vi":
                prompt = (
                    "Bạn là một trợ lý hỗ trợ người khiếm thị. Hãy phân tích bố cục của bức ảnh này "
                    "(có thể là menu nhà hàng hoặc trang sách). Hãy mô tả chi tiết các phần: Tiêu đề, "
                    "các mục lớn, danh sách các món ăn kèm giá tiền (nếu là menu) hoặc các đoạn văn bản "
                    "(nếu là sách). Sử dụng ngôn ngữ tự nhiên để người dùng dễ nghe qua công cụ đọc màn hình. "
                    "Ví dụ: 'Menu có 3 phần chính: Khai vị, Món chính và Đồ uống. Phần khai vị gồm có súp cua "
                    "giá 50 ngàn...'"
                )
            else:
                prompt = (
                    "You are an assistant for the visually impaired. Analyze the layout of this image "
                    "(menu or book page). Describe sections: Title, headers, lists of items with prices "
                    "(if menu) or paragraphs (if book). Use natural language suitable for text-to-speech. "
                    "Example: 'The menu has 3 main sections: Appetizers, Main Courses, and Drinks. "
                    "Appetizers include crab soup for 5 dollars...'"
                )

            logger.info("Performing Layout Analysis with Gemini...")

            response = self.client.models.generate_content(
                model=self.model,
                contents=[
                    prompt,
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type="image/jpeg",
                    ),
                ],
            )

            if response.text:
                return response.text
            return "Không thể phân tích bố cục bức ảnh này."

        except Exception as e:
            logger.error(f"Error calling Gemini API for layout: {e}")
            return "Có lỗi xảy ra khi phân tích bố cục."
