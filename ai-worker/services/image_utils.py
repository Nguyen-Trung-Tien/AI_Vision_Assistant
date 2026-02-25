"""
Tiện ích xử lý ảnh: decode base64, kiểm tra blur, trích xuất màu chủ đạo.
"""

import base64

import cv2
import numpy as np


def decode_base64_image(image_base64: str) -> np.ndarray | None:
    """Giải mã chuỗi base64 thành ảnh OpenCV (BGR)."""
    if not image_base64:
        return None

    payload = image_base64
    if "," in image_base64 and image_base64.startswith("data:"):
        payload = image_base64.split(",", 1)[1]

    try:
        raw = base64.b64decode(payload)
        nparr = np.frombuffer(raw, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return image
    except Exception as exc:
        print(f"[AI Worker] Invalid base64 frame: {exc}")
        return None


def is_blurry(image: np.ndarray, threshold: float = 40.0) -> bool:
    """
    Kiểm tra ảnh có bị mờ không dựa trên phương sai Laplacian.
    Ngưỡng 40.0 được điều chỉnh để nhạy hơn với camera điện thoại phổ thông.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return variance < threshold


def get_dominant_color(image_crop: np.ndarray) -> tuple[int, int, int] | None:
    """Trích xuất màu sắc chủ đạo (HSV) của vùng ảnh cắt."""
    if image_crop is None or image_crop.size == 0:
        return None

    hsv = cv2.cvtColor(image_crop, cv2.COLOR_BGR2HSV)

    # Bỏ qua các vùng quá tối hoặc quá sáng
    mask = cv2.inRange(hsv, np.array([0, 30, 30]), np.array([180, 255, 255]))
    mean_hsv = cv2.mean(hsv, mask=mask)

    return (int(mean_hsv[0]), int(mean_hsv[1]), int(mean_hsv[2]))
