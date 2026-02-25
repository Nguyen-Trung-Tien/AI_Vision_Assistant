"""
Hằng số và dữ liệu tham chiếu cho AI Vision Assistant.
Bao gồm: nhãn tiền, bản dịch, alias mệnh giá, dải màu HSV, đặc trưng tờ tiền.
"""

# --- Money labels ---
MONEY_LABELS: set[str] = {
    "tien_vn", "money", "banknote", "currency", "cash",
    "tien_200d", "tien_500d", "tien_1k", "tien_2k", "tien_5k",
    "tien_10k", "tien_20k", "tien_50k", "tien_100k", "tien_200k", "tien_500k",
}

# --- Label translations (Vietnamese) ---
LABEL_TRANSLATIONS: dict[str, str] = {
    "nguoi": "người",
    "o_to": "ô tô",
    "xe_may": "xe máy",
    "xe_khach_tai": "xe khách hoặc xe tải",
    "tien_200d": "200 đồng",
    "tien_500d": "500 đồng",
    "tien_1k": "1 nghìn",
    "tien_2k": "2 nghìn",
    "tien_5k": "5 nghìn",
    "tien_10k": "10 nghìn",
    "tien_20k": "20 nghìn",
    "tien_50k": "50 nghìn",
    "tien_100k": "100 nghìn",
    "tien_200k": "200 nghìn",
    "tien_500k": "500 nghìn",
    # COCO Street objects
    "person": "người đi bộ",
    "bicycle": "xe đạp",
    "car": "ô tô",
    "motorcycle": "xe máy",
    "bus": "xe buýt",
    "truck": "xe tải",
    "traffic_light": "đèn giao thông",
    "stop_sign": "biển báo dừng lại",
    "dog": "con chó",
    "cat": "con mèo",
    "tree": "cái cây",
    "bench": "ghế dài",
}

# --- Chiều cao trung bình (mét) của vật thể để ước tính khoảng cách ---
OBJECT_REAL_HEIGHTS: dict[str, float] = {
    "person": 1.7,
    "car": 1.5,
    "motorcycle": 1.1,
    "bus": 3.0,
    "truck": 2.5,
    "traffic_light": 2.5,
    "stop_sign": 2.0,
    "bicycle": 1.0,
}

# --- Alias mệnh giá tiền ---
DENOMINATION_ALIASES: dict[str, set[str]] = {
    "200": {
        "200d", "200", "tien_200d", "tien200d", "hai_tram",
    },
    "500": {
        "500d", "500", "tien_500d", "tien500d", "nam_tram",
    },
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

# --- Dải màu HSV cho các mệnh giá polymer VNĐ ---
# OpenCV HSV: H: 0-180, S: 0-255, V: 0-255
COLOR_RANGES: dict[str, dict[str, tuple[int, int]]] = {
    "10000": {"h": (10, 30), "s": (50, 255)},     # Vàng nâu
    "20000": {"h": (100, 130), "s": (50, 255)},    # Xanh dương
    "50000": {"h": (140, 175), "s": (40, 255)},    # Hồng/Tím
    "100000": {"h": (40, 90), "s": (40, 255)},     # Xanh lá
    "200000": {"h": (0, 20), "s": (60, 255)},      # Đỏ cam / Nâu đỏ
    "500000": {"h": (85, 105), "s": (60, 255)},    # Xanh lơ (Cyan)
}

# --- Đặc trưng (danh lam thắng cảnh) trên mỗi mệnh giá ---
DENOMINATION_FEATURES: dict[str, str] = {
    "10000": "mỏ dầu Bạch Hổ",
    "20000": "Chùa Cầu (Hội An)",
    "50000": "Nghinh Lương Đình - Phu Văn Lâu (Huế)",
    "100000": "Văn Miếu - Quốc Tử Giám",
    "200000": "đỉnh Hương (vịnh Hạ Long)",
    "500000": "ngôi nhà tranh của Bác Hồ ở Kim Liên",
}
