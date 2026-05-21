"""
Mô tả cảnh đường phố: vị trí vật thể, khoảng cách, lối đi an toàn.
"""

import cv2
import threading
import time
from collections import OrderedDict
from .constants import OBJECT_REAL_HEIGHTS
from .depth_estimator import DepthEstimator
from .image_utils import decode_base64_image, is_blurry
from .model_manager import ModelManager
from .stabilizer import Stabilizer
from .translations import t, translate_label


# F5: LRU-bounded depth cache — prevents unbounded memory growth for many clients
_DEPTH_CACHE_MAX = 200
_depth_cache: OrderedDict = OrderedDict()  # {client_id: {"timestamp": float, "depth_map": np.ndarray}}
DEPTH_CACHE_TTL = 0.5  # Re-use depth map for 500ms to maintain optimal framerate


def _depth_cache_set(client_id: str, value: dict) -> None:
    """LRU insert into _depth_cache with max-size eviction."""
    if client_id in _depth_cache:
        _depth_cache.move_to_end(client_id)
    _depth_cache[client_id] = value
    while len(_depth_cache) > _DEPTH_CACHE_MAX:
        _depth_cache.popitem(last=False)


def get_spatial_position(box: list[int], img_width: int, lang: str = "vi") -> str:
    """Xác định vị trí tương đối của vật thể trong khung hình."""
    x1, y1, x2, y2 = box
    center_x = (x1 + x2) / 2

    if center_x < img_width / 3:
        return t("position_left", lang)
    elif center_x > (2 * img_width) / 3:
        return t("position_right", lang)
    else:
        return t("position_front", lang)


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


def find_clear_paths(detections: list[dict], img_width: int, lang: str = "vi") -> list[str]:
    """Tìm các khoảng trống ngang trong khung hình để gợi ý lối đi."""
    if not detections:
        return [t("all_clear", lang)]

    # Lấy dải X của tất cả vật thể gần (conf cao)
    occupied_intervals = []
    for d in detections:
        if d["confidence"] > 0.10:
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
            suggestions.append(t("clear_path_left", lang))
        elif center > (2 * img_width) / 3:
            suggestions.append(t("clear_path_right", lang))
        else:
            suggestions.append(t("clear_path_center", lang))

    return suggestions


def process_captioning(image_base64: str, client_id: str = "default", lang: str = "vi") -> dict:
    """
    Xây dựng mô tả không gian chi tiết cho cảnh đường phố với stabilization.
    """
    image = decode_base64_image(image_base64)
    if image is None:
        return {
            "text": t("no_frame", lang),
            "confidence_score": 0.0,
            "stable": False,
            "frame_width": None,
            "frame_height": None,
            "raw_detections": [],
        }

    img_h, img_w, _ = image.shape
    # F4: Async debug frame save — don't block the AI pipeline
    if int(time.time()) % 10 == 0:
        _img_copy = image.copy()
        _path = f"debug_frames/scene_{client_id}.jpg"
        threading.Thread(
            target=cv2.imwrite, args=(_path, _img_copy), daemon=True
        ).start()
    print(f"[AI Worker Caption] Scene frame: {img_w}x{img_h}", flush=True)

    try:
        detections = ModelManager.detect_object(image)
    except Exception as exc:
        print(f"[AI Worker Caption] Model error: {exc}", flush=True)
        return {
            "text": f"Lỗi model: {exc}",
            "confidence_score": 0.0,
            "frame_width": img_w,
            "frame_height": img_h,
            "raw_detections": [],
        }

    if detections:
        print(f"[AI Worker Caption] Found {len(detections)} objects:", flush=True)
        for d in detections:
            print(f"  - {d['label']} ({d['confidence']:.2f})", flush=True)

    # Compute Depth Map if estimation enabled
    depth_estimator = DepthEstimator.get_instance()
    depth_map = None
    if depth_estimator.enabled and detections:
        now = time.time()
        cached = _depth_cache.get(client_id)
        if cached and (now - cached["timestamp"] < DEPTH_CACHE_TTL):
            depth_map = cached["depth_map"]
        else:
            try:
                depth_map = depth_estimator.estimate_depth(image)
                if depth_map is not None:
                    # F5: Use LRU-bounded insert
                    _depth_cache_set(client_id, {"timestamp": now, "depth_map": depth_map})
            except Exception as e:
                print(f"[AI Worker Caption] Depth model execution error: {e}", flush=True)

    if not detections:
        result = {
            "text": t("empty_road", lang),
            "confidence_score": 0.0,
            "stable": False,
            "frame_width": img_w,
            "frame_height": img_h,
            "raw_detections": [],
        }
        Stabilizer.stabilize_caption(client_id, "empty")
        return result

    # Nhóm vật thể theo vị trí và loại
    spatial_groups = {
        t("position_front", lang): {},
        t("position_left", lang): {},
        t("position_right", lang): {},
    }

    significant_objects = []

    # Pre-check for blur
    if is_blurry(image, threshold=35.0):
        # We still continue detection, but we'll prepend a warning if total count is low
        pass

    filtered_count = 0
    for d in detections:
        if d["confidence"] < 0.15:  # Ngưỡng tối thiểu cực nhạy (yêu cầu từ user)
            filtered_count += 1
            continue

        label = d["label"]
        translated = translate_label(label, lang)
        d["display_name"] = translated
        d["category"] = "object"
        pos = get_spatial_position(d["box"], img_w, lang)  # pass lang

        d["position"] = (
            "left" if pos == t("position_left", lang) else "right" if pos == t("position_right", lang) else "center"
        )
        # Continuous pan ratio for spatial audio (0.0=left, 1.0=right)
        x1, _, x2, _ = d["box"]
        d["center_x_ratio"] = round((x1 + x2) / (2.0 * img_w), 4)
        significant_objects.append(translated)

        if translated not in spatial_groups[pos]:
            spatial_groups[pos][translated] = []

        # Ước tính khoảng cách
        if depth_map is not None:
            dist = depth_estimator.get_distance_at_bbox(depth_map, d["box"], label=label)
        else:
            dist = estimate_distance(label, abs(d["box"][3] - d["box"][1]), img_h)

        if dist is not None:
            d["distance"] = dist

        spatial_groups[pos][translated].append(dist)

    if filtered_count > 0:
        print(f"[AI Worker Caption] Filtered {filtered_count} objects below 0.15 confidence.")

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

        pos_key = (
            "left" if pos == t("position_left", lang) else "right" if pos == t("position_right", lang) else "front"
        )
        pos_translated = t(f"position_{pos_key}", lang)
        parts.append(t("has_objects", lang, pos=pos_translated, objects=", ".join(obj_strings)))

    if not parts:
        result = {
            "text": t("no_objects", lang),
            "confidence_score": 0.0,
            "stable": False,
            "frame_width": img_w,
            "frame_height": img_h,
            "raw_detections": [],
        }
        Stabilizer.stabilize_caption(client_id, "none")
        return result

    base_text = ". ".join(parts) + "."

    # Thêm gợi ý lối đi
    clear_paths = find_clear_paths(detections, img_w, lang)  # pass lang
    if clear_paths:
        base_text += t("suggestion", lang) + ", ".join(clear_paths) + "."

    # Đánh giá tổng quan mật độ
    total_objects = sum(sum(len(v) for v in objs.values()) for objs in spatial_groups.values())
    if total_objects > 7:
        base_text = t("crowded", lang) + base_text
    elif total_objects == 0:
        base_text = t("empty_area", lang)

    # Thêm cảnh báo mờ nếu cần
    if is_blurry(image, threshold=35.0):
        base_text = t("blurry", lang) + ". " + base_text

    conf = round(max(d["confidence"] for d in detections), 2)

    # --- Stabilization ---
    scene_key = "-".join(sorted(significant_objects))
    stable = Stabilizer.stabilize_caption(client_id, scene_key)

    raw_detections = [d for d in detections if "distance" in d]
    primary_detection = None
    if raw_detections:
        primary_detection = min(
            raw_detections,
            key=lambda item: item.get("distance", 999),
        )

    return {
        "text": base_text,
        "confidence_score": conf,
        "boxes": [d["box"] for d in detections],
        "object_count": total_objects,
        "stable": stable,
        "raw_detections": raw_detections,
        "primary_detection": primary_detection,
        "frame_width": img_w,
        "frame_height": img_h,
    }
