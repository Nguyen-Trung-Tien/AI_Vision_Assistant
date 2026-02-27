"""
Multi-language translations cho AI Vision Assistant.
Hỗ trợ vi (Việt) và en (English).
"""

TRANSLATIONS: dict[str, dict[str, str]] = {
    "vi": {
        "detecting": "Đang nhận diện...",
        "captioning": "Đang mô tả...",
        "blurry": "Hình ảnh hơi mờ, vui lòng giữ tay ổn định.",
        "no_frame": "Không đọc được khung hình.",
        "no_text": "Không phát hiện nội dung văn bản rõ ràng.",
        "no_money": "Không phát hiện tiền trong khung hình.",
        "confirmed": "Xác nhận",
        "detected": "Phát hiện",
        "denomination_found": "Phát hiện tờ {display_text}{feature}{color}. Độ tin cậy {conf}.",
        "denomination_confirmed": "Xác nhận tờ {display_text}{feature}{color}. Độ tin cậy {conf}.",
        "unknown_money": "Phát hiện tiền Việt Nam nhưng model hiện tại chưa tách mệnh giá rõ ràng. Độ tin cậy {conf}.",
        "color_match": " (Màu sắc khớp)",
        "color_mismatch": " (Màu sắc không khớp lắm)",
        "feature_prefix": ", có hình ",
        "empty_road": "Đường phố phía trước có vẻ vắng lặng.",
        "crowded": "Khu vực đang khá đông đúc. ",
        "empty_area": "Khu vực trống trải.",
        "no_objects": "Không thấy vật thể lớn nào rõ rệt.",
        "clear_path_left": "Lối đi trống bên trái",
        "clear_path_right": "Lối đi trống bên phải",
        "clear_path_center": "Lối đi trống ở giữa",
        "all_clear": "Toàn bộ đường phía trước đều trống.",
        "suggestion": " Gợi ý: ",
        "position_left": "Bên trái",
        "position_right": "Bên phải",
        "position_front": "Phía trước",
        "has_objects": "{pos} có {objects}",
        "approx_distance": " cách khoảng {dist} mét",
        # Danger
        "danger_warning": "Cảnh báo! {label} ở {position}, cách khoảng {distance} mét!",
        "danger_stop": "Dừng lại! Có {label} rất gần phía trước!",
        # Hallucination guard
        "maybe_blurry": "Hình như hơi mờ, nhưng có vẻ là: {text}",
        "seems_like": "Có vẻ như là: {text}",
    },
    "en": {
        "detecting": "Detecting...",
        "captioning": "Describing...",
        "blurry": "Image is blurry, please hold steady.",
        "no_frame": "Could not read the frame.",
        "no_text": "No readable text detected in the frame.",
        "no_money": "No currency detected in the frame.",
        "confirmed": "Confirmed",
        "detected": "Detected",
        "denomination_found": "Detected {display_text}{feature}{color}. Confidence {conf}.",
        "denomination_confirmed": "Confirmed {display_text}{feature}{color}. Confidence {conf}.",
        "unknown_money": "Vietnamese currency detected but denomination is unclear. Confidence {conf}.",
        "color_match": " (Color matches)",
        "color_mismatch": " (Color mismatch)",
        "feature_prefix": ", featuring ",
        "empty_road": "The road ahead appears clear.",
        "crowded": "The area is quite crowded. ",
        "empty_area": "The area is clear.",
        "no_objects": "No significant objects detected.",
        "clear_path_left": "Clear path on the left",
        "clear_path_right": "Clear path on the right",
        "clear_path_center": "Clear path in the center",
        "all_clear": "The entire road ahead is clear.",
        "suggestion": " Suggestion: ",
        "position_left": "On the left",
        "position_right": "On the right",
        "position_front": "Ahead",
        "has_objects": "{pos}: {objects}",
        "approx_distance": " approximately {dist} meters away",
        # Danger
        "danger_warning": "Warning! {label} {position}, approximately {distance} meters away!",
        "danger_stop": "Stop! {label} very close ahead!",
        # Hallucination guard
        "maybe_blurry": "Image seems blurry, but it looks like: {text}",
        "seems_like": "It seems to be: {text}",
    },
}

# Label translations per language
LABEL_TRANSLATIONS_MULTI: dict[str, dict[str, str]] = {
    "vi": {
        "nguoi": "người", "o_to": "ô tô", "xe_may": "xe máy",
        "xe_khach_tai": "xe khách hoặc xe tải",
        "person": "người đi bộ", "bicycle": "xe đạp", "car": "ô tô",
        "motorcycle": "xe máy", "bus": "xe buýt", "truck": "xe tải",
        "traffic_light": "đèn giao thông", "stop_sign": "biển báo dừng lại",
        "dog": "con chó", "cat": "con mèo", "tree": "cái cây", "bench": "ghế dài",
    },
    "en": {
        "nguoi": "person", "o_to": "car", "xe_may": "motorbike",
        "xe_khach_tai": "bus or truck",
        "person": "pedestrian", "bicycle": "bicycle", "car": "car",
        "motorcycle": "motorcycle", "bus": "bus", "truck": "truck",
        "traffic_light": "traffic light", "stop_sign": "stop sign",
        "dog": "dog", "cat": "cat", "tree": "tree", "bench": "bench",
    },
}


def t(key: str, lang: str = "vi", **kwargs) -> str:
    """Get translated string with optional format args."""
    template = TRANSLATIONS.get(lang, TRANSLATIONS["vi"]).get(key, key)
    if kwargs:
        return template.format(**kwargs)
    return template


def translate_label(label: str, lang: str = "vi") -> str:
    """Translate object label to target language."""
    labels = LABEL_TRANSLATIONS_MULTI.get(lang, LABEL_TRANSLATIONS_MULTI["vi"])
    return labels.get(label, label)
