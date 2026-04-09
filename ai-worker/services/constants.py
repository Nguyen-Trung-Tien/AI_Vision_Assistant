"""Constants and label normalization for AI Vision Assistant."""

CANONICAL_CLASSES: list[str] = [
    "tien_1k",
    "tien_2k",
    "tien_5k",
    "tien_10k",
    "tien_20k",
    "tien_50k",
    "tien_100k",
    "tien_200k",
    "tien_500k",
    "xe_may",
    "cau_thang",
    "o_ga",
    "ong_cong",
    "xe_lon",
    "nguoi",
    "den_giao_thong",
    "den_do",
    "den_vang",
    "den_xanh",
    "vach_qua_duong",
]

# Legacy labels are mapped into canonical classes before app logic consumes detections.
LEGACY_LABEL_ALIASES: dict[str, str] = {
    "person": "nguoi",
    "male": "nguoi",
    "female": "nguoi",
    "car": "xe_lon",
    "truck": "xe_lon",
    "bus": "xe_lon",
    "motorbike": "xe_may",
    "motorcycle": "xe_may",
    "stairs_up": "cau_thang",
    "stairs_down": "cau_thang",
    "pothole": "o_ga",
    "manhole": "ong_cong",
    "open_manhole": "ong_cong",
    "traffic_light": "den_giao_thong",
    "traffic_light_red": "den_do",
    "traffic_light_yellow": "den_vang",
    "traffic_light_green": "den_xanh",
    "red_light": "den_do",
    "yellow_light": "den_vang",
    "green_light": "den_xanh",
    "red": "den_do",
    "yellow": "den_vang",
    "green": "den_xanh",
    "den_do": "den_do",
    "den_vang": "den_vang",
    "den_xanh": "den_xanh",
    "crosswalk": "vach_qua_duong",
}


def canonicalize_label(label: str) -> str:
    normalized = label.strip().lower().replace("-", "_").replace(" ", "_")
    if normalized in CANONICAL_CLASSES:
        return normalized
    return LEGACY_LABEL_ALIASES.get(normalized, normalized)


# --- Money labels ---
MONEY_LABELS: set[str] = {
    "tien_1k",
    "tien_2k",
    "tien_5k",
    "tien_10k",
    "tien_20k",
    "tien_50k",
    "tien_100k",
    "tien_200k",
    "tien_500k",
}

# --- Label translations (Vietnamese) ---
LABEL_TRANSLATIONS: dict[str, str] = {
    "nguoi": "người",
    "xe_may": "xe máy",
    "xe_lon": "xe lớn",
    "cau_thang": "cầu thang",
    "o_ga": "ổ gà",
    "ong_cong": "ống cống",
    "den_giao_thong": "đèn giao thông",
    "den_do": "đèn đỏ",
    "den_vang": "đèn vàng",
    "den_xanh": "đèn xanh",
    "vach_qua_duong": "vạch qua đường",
    "tien_1k": "1 nghìn",
    "tien_2k": "2 nghìn",
    "tien_5k": "5 nghìn",
    "tien_10k": "10 nghìn",
    "tien_20k": "20 nghìn",
    "tien_50k": "50 nghìn",
    "tien_100k": "100 nghìn",
    "tien_200k": "200 nghìn",
    "tien_500k": "500 nghìn",
}

# --- Average object heights (meters) for rough distance estimation ---
OBJECT_REAL_HEIGHTS: dict[str, float] = {
    "nguoi": 1.7,
    "xe_may": 1.1,
    "xe_lon": 2.6,
    "den_giao_thong": 2.5,
    "den_do": 2.5,
    "den_vang": 2.5,
    "den_xanh": 2.5,
    "cau_thang": 0.5,
    "ong_cong": 0.1,
    "o_ga": 0.1,
}

# --- Money denomination aliases ---
DENOMINATION_ALIASES: dict[str, set[str]] = {
    "1000": {
        "1k", "1_000", "1000", "1.000", "1,000",
        "tien_1k", "tien_1000", "tien1k",
    },
    "2000": {
        "2k", "2_000", "2000", "2.000", "2,000",
        "tien_2k", "tien_2000", "tien2k",
    },
    "5000": {
        "5k", "5_000", "5000", "5.000", "5,000",
        "tien_5k", "tien_5000", "tien5k",
    },
    "10000": {
        "10k", "10_000", "10000", "10.000", "10,000",
        "tien_10k", "tien_10000", "tien10k",
    },
    "20000": {
        "20k", "20_000", "20000", "20.000", "20,000",
        "tien_20k", "tien_20000", "tien20k",
    },
    "50000": {
        "50k", "50_000", "50000", "50.000", "50,000",
        "tien_50k", "tien_50000", "tien50k",
    },
    "100000": {
        "100k", "100_000", "100000", "100.000", "100,000",
        "tien_100k", "tien_100000", "tien100k",
    },
    "200000": {
        "200k", "200_000", "200000", "200.000", "200,000",
        "tien_200k", "tien_200000", "tien200k",
    },
    "500000": {
        "500k", "500_000", "500000", "500.000", "500,000",
        "tien_500k", "tien_500000", "tien500k",
    },
}

# --- HSV ranges for VN polymer banknotes ---
# OpenCV HSV: H: 0-180, S: 0-255, V: 0-255
COLOR_RANGES: dict[str, dict[str, tuple[int, int]]] = {
    "10000": {"h": (10, 30), "s": (50, 255)},
    "20000": {"h": (100, 130), "s": (50, 255)},
    "50000": {"h": (140, 175), "s": (40, 255)},
    "100000": {"h": (40, 90), "s": (40, 255)},
    "200000": {"h": (0, 20), "s": (60, 255)},
    "500000": {"h": (85, 105), "s": (60, 255)},
}

# --- Landmark cues printed on denominations ---
DENOMINATION_FEATURES: dict[str, str] = {
    "10000": "mỏ dầu Bạch Hổ",
    "20000": "Chùa Cầu (Hội An)",
    "50000": "Nghinh Lương Đình - Phu Văn Lâu (Huế)",
    "100000": "Văn Miếu - Quốc Tử Giám",
    "200000": "hòn Đỉnh Hương (vịnh Hạ Long)",
    "500000": "nhà tranh của Bác Hồ ở Kim Liên",
}
