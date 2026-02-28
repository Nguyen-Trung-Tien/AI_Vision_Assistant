"""
Nhận diện tiền Việt Nam: chuẩn hóa label, trích mệnh giá,
kiểm tra màu sắc, tỉ lệ khung hình, và xử lý OCR chính.
"""

import time
from pathlib import Path

import cv2
import numpy as np

from .constants import (
    COLOR_RANGES,
    DENOMINATION_ALIASES,
    DENOMINATION_FEATURES,
    LABEL_TRANSLATIONS,
    MONEY_LABELS,
)
from .image_utils import decode_base64_image, get_dominant_color, is_blurry
from .model_manager import ModelManager
from .stabilizer import Stabilizer
from .translations import t


def normalize_label(label: str) -> str:
    """Chuẩn hóa label: lowercase, thay thế dấu cách/gạch ngang."""
    return label.strip().lower().replace("-", "_").replace(" ", "_")


def extract_denomination(label: str) -> str | None:
    """Trích xuất mệnh giá từ label (trả về dạng chuỗi số, VD '50000')."""
    normalized = normalize_label(label)
    compact = (
        normalized.replace(".", "")
        .replace(",", "")
        .replace("vnd", "")
        .replace("vnđ", "")
        .replace("đ", "")
        .replace("dong", "")
        .replace("_", "")
    )

    for value, aliases in DENOMINATION_ALIASES.items():
        if normalized in aliases:
            return value
        if compact in aliases:
            return value
        if value in compact:
            return value
    return None


def validate_denomination_by_color(hsv: tuple[int, int, int], denomination: str) -> bool:
    """Kiểm tra màu sắc HSV có khớp với mệnh giá dự đoán không."""
    if denomination not in COLOR_RANGES:
        # Chưa có profile màu cho mệnh giá này (VD: 1k, 2k, 5k) → mặc định True
        return True

    target = COLOR_RANGES[denomination]
    h, s, v = hsv

    h_min, h_max = target["h"]
    s_min, s_max = target["s"]

    # Xử lý Hue vòng qua 0 (cho màu đỏ/cam)
    if h_min > h_max:
        h_match = (h >= h_min or h <= h_max)
    else:
        h_match = (h_min <= h <= h_max)

    s_match = (s_min <= s <= s_max)

    return h_match and s_match


def validate_aspect_ratio(box: list[int]) -> bool:
    """
    Kiểm tra tỉ lệ khung hình (dài/rộng) của tờ tiền.
    Tờ tiền VN polymer có tỉ lệ xấp xỉ 2.2 - 2.3.
    """
    x1, y1, x2, y2 = box
    w = abs(x2 - x1)
    h = abs(y2 - y1)
    if h == 0 or w == 0:
        return False

    ratio = max(w / h, h / w)
    # Chấp nhận dải rộng 1.8 - 2.8 để tính đến bị nghiêng/khuất
    return 1.8 <= ratio <= 2.8


def process_ocr(image_base64: str, client_id: str = "default", lang: str = "vi") -> dict:
    """
    Detect money/objects từ frame thực với temporal stabilization.
    """
    image = decode_base64_image(image_base64)
    if image is None:
        return {
            "text": t("no_frame", lang=lang),
            "confidence_score": 0.0,
            "boxes": [],
        }

    # 1. Kiểm tra độ nhòe
    if is_blurry(image):
        return {
            "text": t("blurry", lang=lang),
            "confidence_score": 0.3,
            "boxes": [],
            "is_blurry": True,
        }

    try:
        detections = ModelManager.detect(image)
    except Exception as exc:
        print(f"[AI Worker OCR] Model error: {exc}")
        return {
            "text": f"Lỗi model: {exc}",
            "confidence_score": 0.0,
            "boxes": [],
        }

    print(f"[AI Worker OCR] Total detections: {len(detections)}", flush=True)
    for d in detections:
        print(f"  -> label='{d['label']}' conf={d['confidence']:.3f} box={d['box']}", flush=True)

    # DEBUG: Lưu ảnh nếu không có detection (giới hạn 50 file)
    if not detections:
        debug_dir = Path("debug_frames")
        debug_dir.mkdir(exist_ok=True)

        # Auto-cleanup: giữ tối đa 50 file, xóa cũ nhất
        existing = sorted(debug_dir.glob("fail_*.jpg"), key=lambda p: p.stat().st_mtime)
        while len(existing) >= 50:
            existing.pop(0).unlink(missing_ok=True)

        debug_path = debug_dir / f"fail_{int(time.time())}.jpg"
        cv2.imwrite(str(debug_path), image)
        print(f"[AI Worker OCR] Saved fail frame to {debug_path}", flush=True)

    money_detections = []
    valued_money = []
    for detection in detections:
        label = detection["label"]
        normalized = normalize_label(label)
        denomination = extract_denomination(label)
        if normalized in MONEY_LABELS or denomination is not None:
            money_detections.append(detection)
            if denomination is not None:
                valued_money.append((detection, denomination))

    if money_detections:
        # Phân tích màu sắc cho các detection có mệnh giá
        final_money_results = []
        for det, denom in valued_money:
            x1, y1, x2, y2 = det["box"]
            crop = image[y1:y2, x1:x2]
            hsv = get_dominant_color(crop)

            color_valid = False
            if hsv:
                color_valid = validate_denomination_by_color(hsv, denom)
                det["hsv"] = hsv
                det["color_valid"] = color_valid

            score = float(det["confidence"])
            final_money_results.append((det, denom, score))

        if final_money_results:
            best_item, denomination, final_score = max(
                final_money_results, key=lambda x: x[2]
            )

            conf = round(float(best_item["confidence"]), 2)
            label = best_item["label"]
            
            # Format display text according to language
            if lang == "en":
                # For English we might want just "50000 VND"
                display_text = f"{denomination} VND" if denomination else label
            else:
                display_text = LABEL_TRANSLATIONS.get(label, f"{denomination} đồng")

            # Thêm đặc trưng landmark
            feature = DENOMINATION_FEATURES.get(denomination)
            if feature:
                feature_text = t("feature_prefix", lang=lang) + feature
            else:
                feature_text = ""

            color_info = ""
            if "hsv" in best_item:
                h, s, v = best_item["hsv"]
                status_key = "color_match" if best_item.get("color_valid") else "color_mismatch"
                color_info = t(status_key, lang=lang)

            result = {
                "text": t(
                    "denomination_found",
                    lang=lang,
                    display_text=display_text,
                    feature=feature_text,
                    color=color_info,
                    conf=conf,
                ),
                "confidence_score": conf,
                "boxes": [d["box"] for d in money_detections],
                "denomination": denomination,
                "stable": False,
            }
        else:
            # Có money_detections chung chung
            best = max(money_detections, key=lambda x: x["confidence"])
            conf = round(float(best["confidence"]), 2)
            result = {
                "text": t("unknown_money", lang=lang, conf=conf),
                "confidence_score": conf,
                "boxes": [d["box"] for d in money_detections],
                "denomination": "unknown_money",
                "stable": False,
            }
    else:
        best_conf = round(max((d["confidence"] for d in detections), default=0.0), 2)
        result = {
            "text": t("no_money", lang=lang),
            "confidence_score": best_conf,
            "boxes": [d["box"] for d in detections],
            "denomination": None,
            "stable": False,
        }

    # --- Temporal Stabilization ---
    stable = Stabilizer.stabilize_ocr(client_id, result.get("denomination"))
    if stable:
        result["stable"] = True
        if result.get("denomination") and result["denomination"] != "unknown_money":
            detected_str = t("detected", lang=lang)
            confirmed_str = t("confirmed", lang=lang)
            result["text"] = result["text"].replace(detected_str, confirmed_str)

    return result
