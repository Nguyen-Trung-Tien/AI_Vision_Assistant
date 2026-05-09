"""
Object Detection Model Manager — Quản lý riêng model nhận diện vật thể đường phố.

Classes (13):
    bang_hieu, cau_thang, den_xanh, den_do, nap_cong, nguoi, o_ga,
    rao_chan, thung_rac, vach_qua_duong, xe_may, xe_dap, xe_lon
"""

import os
import importlib.util
from pathlib import Path
from typing import Any

import numpy as np

from .constants import canonicalize_label

try:
    from ultralytics import YOLO
except Exception:  # pragma: no cover
    YOLO = None


class ObjectModelManager:
    """Singleton-style manager for object detection YOLO model."""

    _model = None

    @classmethod
    def _candidates(cls) -> list[Path]:
        """Ordered model paths for object recognition."""
        service_dir = Path(__file__).resolve().parent
        ai_worker_dir = service_dir.parent

        env_model = os.getenv("OBJECT_MODEL_PATH")
        env_candidates = [Path(env_model)] if env_model else []

        candidates = [
            ai_worker_dir / "models" / "object-recognition" / "best.pt",
            ai_worker_dir / "models" / "object-recognition" / "last.pt",
            ai_worker_dir / "models" / "object-recognition" / "onnx" / "best.onnx",
        ]

        seen: set[Path] = set()
        ordered: list[Path] = []
        for path in env_candidates + candidates:
            p = path.resolve() if not path.is_absolute() else path
            if p in seen:
                continue
            seen.add(p)
            ordered.append(p)
        return ordered

    @staticmethod
    def _can_load(path: Path) -> bool:
        suffix = path.suffix.lower()
        if suffix == ".tflite":
            if importlib.util.find_spec("tensorflow") is None:
                print(f"[ObjectModel] Skipping TFLite (tensorflow missing): {path}")
                return False
        return True

    @classmethod
    def load(cls):
        """Lazy-load the object detection model."""
        if cls._model is not None:
            return cls._model
        if YOLO is None:
            raise RuntimeError("ultralytics is not installed")

        errors: list[str] = []
        for candidate in cls._candidates():
            if not candidate.exists():
                continue
            if not cls._can_load(candidate):
                continue
            try:
                print(f"[ObjectModel] Loading: {candidate}")
                cls._model = YOLO(str(candidate))
                if hasattr(cls._model, "names"):
                    print(f"[ObjectModel] Classes ({len(cls._model.names)}): {list(cls._model.names.values())}")
                return cls._model
            except Exception as exc:
                errors.append(f"{candidate}: {exc}")
                print(f"[ObjectModel] Failed: {candidate}: {exc}")

        if errors:
            print("[ObjectModel] No loadable model found. Errors: " + " | ".join(errors))
        return None

    @classmethod
    def detect(cls, image: np.ndarray) -> list[dict[str, Any]]:
        """Run YOLO inference for general objects."""
        model = cls.load()
        if model is None:
            print("[ObjectModel] Model missing, skipping detection.")
            return []

        results = model.predict(source=image, verbose=False, conf=0.15)
        detections: list[dict[str, Any]] = []

        if not results:
            return detections

        result = results[0]
        raw_count = len(result.boxes) if hasattr(result, "boxes") and result.boxes is not None else 0
        if raw_count > 0:
            print(f"[ObjectModel] Raw boxes: {raw_count}")

        names = result.names if hasattr(result, "names") else {}
        boxes = result.boxes
        if boxes is None:
            return detections

        for box in boxes:
            cls_id = int(box.cls.item())
            conf = float(box.conf.item())
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            raw_label = str(names.get(cls_id, cls_id))
            label = canonicalize_label(raw_label)
            detections.append(
                {
                    "label": label,
                    "confidence": conf,
                    "box": [int(x1), int(y1), int(x2), int(y2)],
                }
            )
        return detections

    @classmethod
    def reload(cls, model_path: str = None):
        """Clear cached model and reload."""
        print(f"[ObjectModel] Reloading... (path: {model_path})")
        cls._model = None
        if model_path:
            os.environ["OBJECT_MODEL_PATH"] = model_path
        cls.load()
        return cls._model is not None

    @classmethod
    def get_candidates(cls) -> list[Path]:
        """Public accessor for candidate paths (used by façade)."""
        return cls._candidates()

    @classmethod
    def is_loaded(cls) -> bool:
        return cls._model is not None
