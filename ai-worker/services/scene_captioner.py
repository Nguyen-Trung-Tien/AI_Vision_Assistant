"""
Mô tả cảnh đường phố: vị trí vật thể, khoảng cách, lối đi an toàn.
"""

import numpy as np

from .constants import LABEL_TRANSLATIONS, OBJECT_REAL_HEIGHTS
from .image_utils import decode_base64_image
from .model_manager import ModelManager
from .stabilizer import Stabilizer
from .translations import t, translate_label


def get_spatial_position(box: list[int], img_width: int) -> str:
    """Xác định vị trí tương đối của vật thể trong khung hình."""
    x1, y1, x2, y2 = box
    center_x = (x1 + x2) / 2

    if center_x < img_width / 3:
        return "Bên trái"
    elif center_x > (2 * img_width) / 3:
        return "Bên phải"
    else:
        return "Phía trước"


def estimate_distance(label: str, box_height_px: int, img_height_px: int) -> float | None:
    """
    Ước tính khoảng cách (mét) dựa trên kích thước vật thể.
    Công thức: Distance = (RealHeight * FocalLength) / PixelHeight
    Giả định FocalLength ~ img_height cho camera điện thoại phổ thông.
    """
    real_h = OBJECT_REAL_HEIGHTS.get(label)
    if not real_h:
        return None

    f_pixel = img_height_px
    distance = (real_h * f_pixel) / box_height_px
    return round(distance, 1)


def find_clear_paths(detections: list[dict], img_width: int) -> list[str]:
    """Tìm các khoảng trống ngang trong khung hình để gợi ý lối đi."""
    if not detections:
        return ["Toàn bộ đường phía trước đều trống."]

    # Lấy dải X của tất cả vật thể gần (conf cao)
    occupied_intervals = []
    for d in detections:
        if d["confidence"] > 0.4:
            x1, _, x2, _ = d["box"]
            occupied_intervals.append((x1, x2))

    occupied_intervals.sort()

    # Hợp nhất các dải bị chồng lấn
    merged = []
    if occupied_intervals:
        curr_start, curr_end = occupied_intervals[0]
        for next_start, next_end in occupied_intervals[1:]:
            if next_start < curr_end:
                curr_end = max(curr_end, next_end)
            else:
                merged.append((curr_start, curr_end))
                curr_start, curr_end = next_start, next_end
        merged.append((curr_start, curr_end))

    # Tìm các khoảng trống (gaps)
    gaps = []
    last_end = 0
    for start, end in merged:
        if start - last_end > img_width * 0.25:  # Khoảng trống ít nhất 25% chiều ngang
            gaps.append((last_end, start))
        last_end = end
    if img_width - last_end > img_width * 0.25:
        gaps.append((last_end, img_width))

    suggestions = []
    for g_start, g_end in gaps:
        center = (g_start + g_end) / 2
        if center < img_width / 3:
            suggestions.append("Lối đi trống bên trái")
        elif center > (2 * img_width) / 3:
            suggestions.append("Lối đi trống bên phải")
        else:
            suggestions.append("Lối đi trống ở giữa")

    return suggestions


def process_captioning(image_base64: str, client_id: str = "default", lang: str = "vi") -> dict:
    """
    Xây dựng mô tả không gian chi tiết cho cảnh đường phố với stabilization.
    """
    image = decode_base64_image(image_base64)
    if image is None:
        return {"text": t("no_frame", lang), "confidence_score": 0.0}

    img_h, img_w, _ = image.shape
    print(f"[AI Worker Caption] Scene frame: {img_w}x{img_h}", flush=True)

    try:
        detections = ModelManager.detect(image)
    except Exception as exc:
        print(f"[AI Worker Caption] Model error: {exc}", flush=True)
        return {"text": f"Lỗi model: {exc}", "confidence_score": 0.0}

    if detections:
        print(f"[AI Worker Caption] Found {len(detections)} objects:", flush=True)
        for d in detections:
            print(f"  - {d['label']} ({d['confidence']:.2f})", flush=True)

    if not detections:
        result = {
            "text": t("empty_road", lang),
            "confidence_score": 0.0,
            "stable": False,
        }
        Stabilizer.stabilize_caption(client_id, "empty")
        return result

    # Nhóm vật thể theo vị trí và loại
    spatial_groups = {
        "Phía trước": {},
        "Bên trái": {},
        "Bên phải": {},
    }

    significant_objects = []
    for d in detections:
        if d["confidence"] < 0.35:  # Ngưỡng tối thiểu cho captioning
            continue

        label = d["label"]
        translated = translate_label(label, lang)
        pos = get_spatial_position(d["box"], img_w)
        significant_objects.append(translated)

        if translated not in spatial_groups[pos]:
            spatial_groups[pos][translated] = []

        # Ước tính khoảng cách
        dist = estimate_distance(label, abs(d["box"][3] - d["box"][1]), img_h)
        spatial_groups[pos][translated].append(dist)

    # Xây dựng câu mô tả
    parts = []
    for pos, objects in spatial_groups.items():
        if not objects:
            continue

        obj_strings = []
        for name, distances in objects.items():
            count = len(distances)
            valid_dists = [d for d in distances if d is not None]
            dist_str = ""
            if valid_dists:
                min_dist = min(valid_dists)
                dist_str = t("approx_distance", lang, dist=min_dist)

            if count > 1:
                obj_strings.append(f"{count} {name}{dist_str}")
            else:
                obj_strings.append(f"{name}{dist_str}")

        pos_translated = t(f"position_{('left' if pos == 'Bên trái' else 'right' if pos == 'Bên phải' else 'front')}", lang)
        parts.append(t("has_objects", lang, pos=pos_translated, objects=', '.join(obj_strings)))

    if not parts:
        result = {
            "text": t("no_objects", lang),
            "confidence_score": 0.0,
            "stable": False,
        }
        Stabilizer.stabilize_caption(client_id, "none")
        return result

    base_text = ". ".join(parts) + "."

    # Thêm gợi ý lối đi
    clear_paths = find_clear_paths(detections, img_w)
    if clear_paths:
        base_text += t("suggestion", lang) + ", ".join(clear_paths) + "."

    # Đánh giá tổng quan mật độ
    total_objects = sum(
        sum(len(v) for v in objs.values()) for objs in spatial_groups.values()
    )
    if total_objects > 7:
        base_text = t("crowded", lang) + base_text
    elif total_objects == 0:
        base_text = t("empty_area", lang)

    conf = round(max(d["confidence"] for d in detections), 2)

    # --- Stabilization ---
    scene_key = "-".join(sorted(significant_objects))
    stable = Stabilizer.stabilize_caption(client_id, scene_key)

    return {
        "text": base_text,
        "confidence_score": conf,
        "boxes": [d["box"] for d in detections],
        "object_count": total_objects,
        "stable": stable,
    }
