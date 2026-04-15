"""
Smart OCR: Sử dụng Gemini Vision để hiểu ngữ cảnh Text (Biển báo, Menu, Hóa đơn).
"""

from .image_utils import decode_base64_image, is_blurry
from .translations import t
from .gemini_service import GeminiService
import logging

logger = logging.getLogger(__name__)

def process(image_base64: str, sub_mode: str = "general", lang: str = "vi") -> dict:
    """
    Xử lý Smart OCR sử dụng Gemini Vision API.
    Trả về Dict cấu trúc tương tự text_ocr.py
    """
    image = decode_base64_image(image_base64)
    if image is None:
        return {"text": t("no_frame", lang), "confidence_score": 0.0, "stable": False}

    if is_blurry(image):
        return {"text": t("blurry", lang), "confidence_score": 0.3, "stable": False}

    gemini_svc = GeminiService()

    # Prompt Engineering theo sub_mode
    if sub_mode == "sign":
        prompt = (
            "Có biển báo giao thông hoặc cảnh báo nào trong hình không? "
            "Nếu có, hãy giải thích ý nghĩa của nó bằng 1 câu ngắn gọn. "
            "Nếu không có, hãy trả lời chính xác là: 'Không tìm thấy biển báo'."
        )
    elif sub_mode == "menu":
        prompt = (
            "Hãy đọc và tóm tắt thực đơn trong hình. Liệt kê tên các món ăn và mức giá tương ứng. "
            "Liệt kê tự nhiên thành từng câu ngắn, ví dụ: 'Phở bò 40 nghìn. Bún chả 35 nghìn'. "
            "Nếu menu quá dài, chỉ liệt kê 5-7 món nổi bật nhất. Không dùng gạch đầu dòng."
        )
    elif sub_mode == "receipt":
        prompt = (
            "Đây là một tờ hóa đơn. Hãy đọc và tìm ra tổng số tiền phải thanh toán "
            "(thường là Tổng cộng hoặc Total). Trả lời bằng 1 câu duy nhất, ví dụ: 'Tổng hóa đơn là 250 nghìn đồng'."
        )
    else:
        # general mode
        prompt = (
            "Hãy tóm tắt ngắn gọn các nội dung chữ viết xuất hiện trong hình ảnh này thành một câu."
        )

    # Đảm bảo ngôn ngữ
    if lang == "en":
        prompt += " Please answer in English only."
    else:
        prompt += " Chỉ trả lời bằng Tiếng Việt."

    # Lấy image bytes raw từ base64 padding
    try:
        import base64
        clean_b64 = image_base64.split(",")[1] if "," in image_base64 else image_base64
        img_bytes = base64.b64decode(clean_b64)
    except Exception as e:
        logger.error(f"Base64 decode error in smart_ocr: {e}")
        return {"text": "Lỗi định dạng ảnh.", "confidence_score": 0.0, "stable": False}

    # Gọi API
    result_text = gemini_svc.ask_gemini_vision(img_bytes, prompt)
    
    if not result_text or "có lỗi" in result_text.lower():
        return {
            "text": "Không thể phân tích nội dung lúc này.",
            "confidence_score": 0.0,
            "stable": False
        }

    return {
        "text": result_text.strip(),
        "confidence_score": 1.0, 
        "stable": True,
        "danger_alerts": []
    }
