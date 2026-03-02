"""
OCR text reader for online text mode.
Uses pytesseract when available (cross-platform path detection).
"""

import os
import shutil

import cv2
import numpy as np
import pytesseract

# Auto-detect tesseract executable (cross-platform)
_tesseract_cmd = (
    os.getenv("TESSERACT_CMD")
    or shutil.which("tesseract")
    or r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)
if _tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = _tesseract_cmd

from .image_utils import decode_base64_image, is_blurry
from .translations import t


def _preprocess_for_ocr(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    return cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11,
    )


def _calc_confidence(image, lang: str) -> float:
    """
    Tính confidence thực bằng pytesseract image_to_data.
    Trả về trung bình confidence của các từ nhận diện được (0.0 - 1.0).
    """
    try:
        data = pytesseract.image_to_data(
            image, lang=lang, output_type=pytesseract.Output.DICT
        )
        confs = [
            int(c)
            for c in data.get("conf", [])
            if str(c).lstrip("-").isdigit() and int(c) >= 0
        ]
        if not confs:
            return 0.0
        return round(sum(confs) / len(confs) / 100, 2)
    except Exception:
        return 0.0


def process_text_ocr(image_base64: str, client_id: str = "default", lang: str = "vi") -> dict:
    _ = client_id  # keep API compatibility and future stabilization hook

    image = decode_base64_image(image_base64)
    if image is None:
        return {"text": t("no_frame", lang), "confidence_score": 0.0, "stable": False}

    if is_blurry(image):
        return {"text": t("blurry", lang), "confidence_score": 0.3, "stable": False}

    try:
        processed = _preprocess_for_ocr(image)
        ocr_lang = "vie+eng" if lang == "vi" else "eng"
        text = pytesseract.image_to_string(processed, lang=ocr_lang).strip()

        # Tính confidence thực từ data
        confidence = _calc_confidence(processed, lang=ocr_lang)

    except Exception as exc:
        return {
            "text": f"OCR error: {exc}",
            "confidence_score": 0.0,
            "stable": False,
        }

    if not text:
        return {
            "text": t("no_text", lang),
            "confidence_score": 0.0,
            "stable": False,
        }

    return {
        "text": text,
        "confidence_score": confidence,
        "stable": False,
    }
