"""
Quản lý YOLO model: lazy-load và object detection.
"""

from pathlib import Path
from typing import Any

import numpy as np

try:
    from ultralytics import YOLO
except Exception:  # pragma: no cover
    YOLO = None


class ModelManager:
    """Singleton-style manager cho YOLO model."""

    _model = None

    @classmethod
    def model_candidates(cls) -> list[Path]:
        """Danh sách đường dẫn model theo thứ tự ưu tiên."""
        return [
            Path("runs/detect/vision_assistant_model5/weights/best.pt"),
            Path("runs/detect/vision_assistant_model4/weights/best.pt"),
            Path("runs/detect/vision_assistant_model3/weights/best.pt"),
            Path("runs/detect/vision_assistant_model3/weights/last.pt"),
            Path("runs/detect/vision_assistant_model2/weights/best.pt"),
            Path("runs/detect/vision_assistant_model2/weights/last.pt"),
            Path("runs/detect/vision_assistant_model/weights/best.pt"),
            Path("runs/detect/vision_assistant_model/weights/last.pt"),
            Path("yolo11n.pt"),
        ]

    @classmethod
    def load_model(cls):
        """Lazy-load YOLO model từ checkpoint tốt nhất có sẵn."""
        if cls._model is not None:
            return cls._model
        if YOLO is None:
            raise RuntimeError("ultralytics is not installed")

        for candidate in cls.model_candidates():
            if candidate.exists():
                print(f"[AI Worker] Loading model: {candidate}")
                cls._model = YOLO(str(candidate))
                return cls._model

        raise FileNotFoundError("No YOLO model found for detection")

    @classmethod
    def detect(cls, image: np.ndarray) -> list[dict[str, Any]]:
        """
        Chạy YOLO inference trên ảnh.
        Returns: list[{label, confidence, box}]
        """
        model = cls.load_model()
        # Lowered confidence from 0.25 to 0.15 for better real-world recall
        results = model.predict(source=image, verbose=False, conf=0.15)
        detections: list[dict[str, Any]] = []

        if not results:
            return detections

        result = results[0]
        names = result.names if hasattr(result, "names") else {}
        boxes = result.boxes
        if boxes is None:
            return detections

        for box in boxes:
            cls_id = int(box.cls.item())
            conf = float(box.conf.item())
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            label = str(names.get(cls_id, cls_id))
            detections.append(
                {
                    "label": label,
                    "confidence": conf,
                    "box": [int(x1), int(y1), int(x2), int(y2)],
                }
            )
        return detections
