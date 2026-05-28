"""
OCR text reader for online text mode.
Primary: Gemini Vision API (superior Vietnamese diacritics accuracy).
Fallback: pytesseract (when GEMINI_API_KEY is not configured).
"""

import base64
import logging
import os
import shutil

import cv2
import pytesseract

from .gemini_service import GeminiService, clean_markdown
from .image_utils import decode_base64_image, is_blurry
from .translations import t

logger = logging.getLogger(__name__)

# Auto-detect tesseract executable (cross-platform) — fallback only
_tesseract_cmd = (
    os.getenv("TESSERACT_CMD") or shutil.which("tesseract") or r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)
if _tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = _tesseract_cmd


# ── Gemini-based OCR (primary) ──────────────────────────────────────────

def _build_ocr_prompt(lang: str) -> str:
    """Build a prompt optimized for accurate text reading."""
    if lang == "vi":
        return (
            "Bạn là trợ lý đọc văn bản cho người khiếm thị. "
            "Hãy đọc CHÍNH XÁC toàn bộ chữ viết trong hình ảnh này. "
            "Giữ nguyên dấu tiếng Việt (sắc, huyền, hỏi, ngã, nặng) — KHÔNG ĐƯỢC bỏ dấu hoặc đổi dấu. "
            "Nếu có nhiều dòng, đọc từ trên xuống dưới, từ trái sang phải. "
            "Chỉ trả về nội dung văn bản đã đọc được, không giải thích thêm. "
            "TUYỆT ĐỐI KHÔNG dùng markdown (*, **, #) hay danh sách gạch đầu dòng."
        )
    return (
        "You are a text reading assistant for the visually impaired. "
        "Read ALL text in this image EXACTLY as written, preserving spelling and punctuation. "
        "Read top to bottom, left to right. "
        "Return ONLY the text content, no explanations. "
        "DO NOT use any markdown formatting (*, **, #) or bullet lists."
    )


def _gemini_ocr(image_base64: str, lang: str) -> dict | None:
    """Attempt OCR via Gemini Vision. Returns result dict or None on failure."""
    gemini = GeminiService()
    if gemini.client is None:
        return None

    try:
        clean_b64 = image_base64.split(",")[1] if "," in image_base64 else image_base64
        img_bytes = base64.b64decode(clean_b64)
    except Exception as e:
        logger.error(f"Base64 decode error in text_ocr: {e}")
        return None

    prompt = _build_ocr_prompt(lang)
    result_text = gemini.ask_gemini_vision(img_bytes, prompt)

    if not result_text or "có lỗi" in result_text.lower() or "error" in result_text.lower():
        return None

    cleaned = clean_markdown(result_text)
    if not cleaned:
        return None

    return {
        "text": cleaned,
        "confidence_score": 1.0,
        "stable": True,
        "danger_alerts": [],
    }


# ── Pytesseract fallback ────────────────────────────────────────────────

def _preprocess_for_ocr(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # CLAHE for better contrast without destroying diacritics
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    # Otsu's threshold is gentler on diacritics than adaptive threshold
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary


def _calc_confidence(image, lang: str) -> float:
    try:
        data = pytesseract.image_to_data(image, lang=lang, output_type=pytesseract.Output.DICT)
        confs = [int(c) for c in data.get("conf", []) if str(c).lstrip("-").isdigit() and int(c) >= 0]
        if not confs:
            return 0.0
        return round(sum(confs) / len(confs) / 100, 2)
    except Exception:
        return 0.0


def _pytesseract_ocr(image_base64: str, lang: str) -> dict:
    """Fallback OCR using pytesseract."""
    image = decode_base64_image(image_base64)
    if image is None:
        return {"text": t("no_frame", lang), "confidence_score": 0.0, "stable": False}

    if is_blurry(image):
        return {"text": t("blurry", lang), "confidence_score": 0.3, "stable": False}

    try:
        processed = _preprocess_for_ocr(image)
        ocr_lang = "vie+eng" if lang == "vi" else "eng"
        text = pytesseract.image_to_string(processed, lang=ocr_lang).strip()
        confidence = _calc_confidence(processed, lang=ocr_lang)
    except Exception as exc:
        return {"text": f"OCR error: {exc}", "confidence_score": 0.0, "stable": False}

    if not text:
        return {"text": t("no_text", lang), "confidence_score": 0.0, "stable": False}

    return {"text": text, "confidence_score": confidence, "stable": True}


# ── Public API ───────────────────────────────────────────────────────────

def process_text_ocr(image_base64: str, client_id: str = "default", lang: str = "vi") -> dict:
    _ = client_id  # keep API compatibility

    # Pre-check: blur detection (fast, avoids wasting Gemini API call)
    image = decode_base64_image(image_base64)
    if image is None:
        return {"text": t("no_frame", lang), "confidence_score": 0.0, "stable": False}
    if is_blurry(image):
        return {"text": t("blurry", lang), "confidence_score": 0.3, "stable": False}

    # Primary: Gemini Vision (accurate Vietnamese diacritics)
    gemini_result = _gemini_ocr(image_base64, lang)
    if gemini_result is not None:
        logger.info(f"[TEXT_OCR] Gemini success for client={client_id}")
        return gemini_result

    # Fallback: pytesseract
    logger.info(f"[TEXT_OCR] Gemini unavailable, falling back to pytesseract for client={client_id}")
    return _pytesseract_ocr(image_base64, lang)
