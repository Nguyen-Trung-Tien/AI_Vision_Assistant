"""
YOLO model manager: lazy-load and object detection.
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


class ModelManager:
    """Singleton-style manager for YOLO model loading."""

    _model = None

    @classmethod
    def model_candidates(cls) -> list[Path]:
        """Ordered model paths (including mobile assets for offline usage)."""
        service_dir = Path(__file__).resolve().parent
        ai_worker_dir = service_dir.parent
        repo_root = ai_worker_dir.parent

        env_model = os.getenv("MODEL_PATH")
        env_candidates = [Path(env_model)] if env_model else []

        candidates = [
            # Prefer native PyTorch checkpoints on server/worker.
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model_v3" / "weights" / "best.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model_v3" / "weights" / "last.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model_v2" / "weights" / "best.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model_v2" / "weights" / "last.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model5" / "weights" / "best.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model4" / "weights" / "best.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model3" / "weights" / "best.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model3" / "weights" / "last.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model2" / "weights" / "best.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model2" / "weights" / "last.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model" / "weights" / "best.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model" / "weights" / "last.pt",
            ai_worker_dir / "yolo11n.pt",
            # TFLite export for mobile only; keep as last-resort fallback.
            repo_root / "mobile_app" / "assets" / "models" / "best_float32.tflite",
        ]

        # Keep env override first, remove duplicates while preserving order.
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
    def _can_load_candidate(path: Path) -> bool:
        """Gate optional runtimes before attempting to load a checkpoint."""
        suffix = path.suffix.lower()
        if suffix == ".tflite":
            has_tf = importlib.util.find_spec("tensorflow") is not None
            if not has_tf:
                print(
                    f"[AI Worker] Skipping TFLite model (tensorflow missing): {path}"
                )
                return False
        return True

    @classmethod
    def load_model(cls):
        """Lazy-load YOLO model from the first valid available checkpoint."""
        if cls._model is not None:
            return cls._model
        if YOLO is None:
            raise RuntimeError("ultralytics is not installed")

        errors: list[str] = []
        for candidate in cls.model_candidates():
            if candidate.exists():
                if not cls._can_load_candidate(candidate):
                    continue
                try:
                    print(f"[AI Worker] Loading model: {candidate}")
                    cls._model = YOLO(str(candidate))
                    return cls._model
                except Exception as exc:
                    errors.append(f"{candidate}: {exc}")
                    print(f"[AI Worker] Failed to load model {candidate}: {exc}")
                    continue

        if errors:
            raise RuntimeError("No loadable YOLO model found. Errors: " + " | ".join(errors))
        raise FileNotFoundError("No YOLO model found for detection")

    @classmethod
    def detect(cls, image: np.ndarray) -> list[dict[str, Any]]:
        """
        Run YOLO inference on an image.
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
