"""
YOLO model manager: lazy-load and object/money detection.
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

    _object_model = None
    _money_model = None

    @classmethod
    def object_model_candidates(cls) -> list[Path]:
        """Ordered model paths for object recognition."""
        service_dir = Path(__file__).resolve().parent
        ai_worker_dir = service_dir.parent
        repo_root = ai_worker_dir.parent

        env_model = os.getenv("OBJECT_MODEL_PATH")
        env_candidates = [Path(env_model)] if env_model else []

        candidates = [
            ai_worker_dir / "models" / "object-recognition" / "best.pt",
            ai_worker_dir / "models" / "object-recognition" / "last.pt",
            # Fallback for old run folders
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model3" / "weights" / "best.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model_v3" / "weights" / "best.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model" / "weights" / "best.pt",
            repo_root / "mobile_app" / "assets" / "models" / "best_float32.tflite",
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

    @classmethod
    def money_model_candidates(cls) -> list[Path]:
        """Ordered model paths for money recognition."""
        service_dir = Path(__file__).resolve().parent
        ai_worker_dir = service_dir.parent

        env_model = os.getenv("MONEY_MODEL_PATH")
        env_candidates = [Path(env_model)] if env_model else []

        candidates = [
            ai_worker_dir / "models" / "money" / "best.pt",
            ai_worker_dir / "models" / "money" / "last.pt",
            # Fallback to combined model if dedicated money model is missing
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model3" / "weights" / "best.pt",
            ai_worker_dir / "runs" / "detect" / "vision_assistant_model_v3" / "weights" / "best.pt",
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
    def _can_load_candidate(path: Path) -> bool:
        """Gate optional runtimes before attempting to load a checkpoint."""
        suffix = path.suffix.lower()
        if suffix == ".tflite":
            has_tf = importlib.util.find_spec("tensorflow") is not None
            if not has_tf:
                print(f"[AI Worker] Skipping TFLite model (tensorflow missing): {path}")
                return False
        return True

    @classmethod
    def load_object_model(cls):
        if cls._object_model is not None:
            return cls._object_model
        if YOLO is None:
            raise RuntimeError("ultralytics is not installed")

        errors: list[str] = []
        for candidate in cls.object_model_candidates():
            if candidate.exists():
                if not cls._can_load_candidate(candidate):
                    continue
                try:
                    print(f"[AI Worker] Loading object model: {candidate}")
                    cls._object_model = YOLO(str(candidate))
                    # Log classes for debugging
                    if hasattr(cls._object_model, "names"):
                        print(f"[AI Worker] Model classes: {list(cls._object_model.names.values())}")
                    return cls._object_model
                except Exception as exc:
                    errors.append(f"{candidate}: {exc}")
                    print(f"[AI Worker] Failed to load object model {candidate}: {exc}")
                    continue

        if errors:
            print("[AI Worker] No loadable YOLO object model found. Errors: " + " | ".join(errors))
        return None

    @classmethod
    def load_money_model(cls):
        if cls._money_model is not None:
            return cls._money_model
        if YOLO is None:
            raise RuntimeError("ultralytics is not installed")

        errors: list[str] = []
        for candidate in cls.money_model_candidates():
            if candidate.exists():
                if not cls._can_load_candidate(candidate):
                    continue
                try:
                    print(f"[AI Worker] Loading money model: {candidate}")
                    cls._money_model = YOLO(str(candidate))
                    return cls._money_model
                except Exception as exc:
                    errors.append(f"{candidate}: {exc}")
                    print(f"[AI Worker] Failed to load money model {candidate}: {exc}")
                    continue

        if errors:
            print("[AI Worker] Failed to load money model. Errors: " + " | ".join(errors))
        return None

    @classmethod
    def _run_inference(cls, model, image: np.ndarray) -> list[dict[str, Any]]:
        # Lowered confidence from 0.25 to 0.15 for better real-world recall
        results = model.predict(source=image, verbose=False, conf=0.15)
        detections: list[dict[str, Any]] = []

        if not results:
            return detections

        result = results[0]
        # Debug: count raw detections before filtering
        raw_count = len(result.boxes) if hasattr(result, "boxes") and result.boxes is not None else 0
        if raw_count > 0:
            print(f"[DEBUG YOLO] Raw boxes found: {raw_count}")
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
    def detect_object(cls, image: np.ndarray) -> list[dict[str, Any]]:
        """Run YOLO inference for general objects."""
        model = cls.load_object_model()
        if model is None:
            print("[AI Worker] Object model missing, skipping detection.")
            return []
        return cls._run_inference(model, image)

    @classmethod
    def detect_money(cls, image: np.ndarray) -> list[dict[str, Any]]:
        """Run YOLO inference for money."""
        model = cls.load_money_model()
        if model is None:
            print("[AI Worker] Untrained model money: Missing weights at models/model-money/best.pt")
            return []
        return cls._run_inference(model, image)

    @classmethod
    def reload_models(cls, object_path: str = None, money_path: str = None):
        """Clear cached models and reload from specified or default paths."""
        print(f"[AI Worker] Reloading models... (Object: {object_path}, Money: {money_path})")

        # Clear existing models
        cls._object_model = None
        cls._money_model = None

        # Update env vars if paths provided
        if object_path:
            os.environ["OBJECT_MODEL_PATH"] = object_path
        if money_path:
            os.environ["MONEY_MODEL_PATH"] = money_path

        # Re-load
        cls.load_object_model()
        cls.load_money_model()

        return {
            "status": "success",
            "object_model": str(cls.object_model_candidates()[0]) if cls._object_model else "None",
            "money_model": str(cls.money_model_candidates()[0]) if cls._money_model else "None",
        }
