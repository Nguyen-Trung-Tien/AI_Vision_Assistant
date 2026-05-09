"""
YOLO model manager — Backward-compatible façade.

Delegates all work to specialized managers:
- ObjectModelManager: 13 object classes (bang_hieu, cau_thang, ...)
- MoneyModelManager:  9 money classes (1000, 2000, ...)
"""

from typing import Any

import numpy as np

from .object_model_manager import ObjectModelManager
from .money_model_manager import MoneyModelManager


class ModelManager:
    """Backward-compatible façade for model loading and inference."""

    # ── Object Detection ──

    @classmethod
    def object_model_candidates(cls):
        return ObjectModelManager.get_candidates()

    @classmethod
    def load_object_model(cls):
        return ObjectModelManager.load()

    @classmethod
    def detect_object(cls, image: np.ndarray) -> list[dict[str, Any]]:
        return ObjectModelManager.detect(image)

    # ── Money Detection ──

    @classmethod
    def money_model_candidates(cls):
        return MoneyModelManager.get_candidates()

    @classmethod
    def load_money_model(cls):
        return MoneyModelManager.load()

    @classmethod
    def detect_money(cls, image: np.ndarray) -> list[dict[str, Any]]:
        return MoneyModelManager.detect(image)

    # ── Shared ──

    @classmethod
    def reload_models(cls, object_path: str = None, money_path: str = None) -> dict:
        """Clear cached models and reload from specified or default paths."""
        print(f"[ModelManager] Reloading models... (Object: {object_path}, Money: {money_path})")

        ObjectModelManager.reload(object_path)
        MoneyModelManager.reload(money_path)

        return {
            "status": "success",
            "object_model": (
                str(ObjectModelManager.get_candidates()[0])
                if ObjectModelManager.is_loaded()
                else "None"
            ),
            "money_model": (
                str(MoneyModelManager.get_candidates()[0])
                if MoneyModelManager.is_loaded()
                else "None"
            ),
        }
