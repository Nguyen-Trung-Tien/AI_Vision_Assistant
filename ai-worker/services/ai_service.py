"""
AI Vision Assistant — Façade module.

Giữ backward-compatible API cho tất cả consumer hiện tại
(rabbitmq_consumer.py, test files).

Logic thực tế được delegate sang các module chuyên biệt:
- constants: labels, translations, color ranges, features
- image_utils: decode, blur, color extraction
- model_manager: YOLO load & detect
- money_detector: OCR/money recognition
- scene_captioner: street scene captioning
- stabilizer: temporal stabilization
"""

from .constants import (
    COLOR_RANGES,
    DENOMINATION_ALIASES,
    DENOMINATION_FEATURES,
    LABEL_TRANSLATIONS,
    MONEY_LABELS,
    OBJECT_REAL_HEIGHTS,
)
from .image_utils import decode_base64_image, get_dominant_color, is_blurry
from .model_manager import ModelManager
from .money_detector import (
    extract_denomination,
    normalize_label,
    process_ocr,
    validate_aspect_ratio,
    validate_denomination_by_color,
)
from .scene_captioner import (
    estimate_distance,
    find_clear_paths,
    get_spatial_position,
    process_captioning,
)
from .stabilizer import Stabilizer


class AIService:
    """
    Backward-compatible façade.
    Tất cả import cũ dạng `from services.ai_service import AIService`
    vẫn hoạt động nguyên vẹn.
    """

    # --- Class-level data attributes (backward compat) ---
    _money_labels = MONEY_LABELS
    _label_translations = LABEL_TRANSLATIONS
    _object_real_heights = OBJECT_REAL_HEIGHTS
    _denomination_aliases = DENOMINATION_ALIASES
    _color_ranges = COLOR_RANGES
    _denomination_features = DENOMINATION_FEATURES

    # --- Delegated classmethods ---

    @classmethod
    def process_ocr(cls, image_base64: str, client_id: str = "default", lang: str = "vi") -> dict:
        return process_ocr(image_base64, client_id, lang=lang)

    @classmethod
    def process_captioning(cls, image_base64: str, client_id: str = "default", lang: str = "vi") -> dict:
        return process_captioning(image_base64, client_id, lang=lang)

    # --- Internal methods re-exported for test backward compat ---

    _normalize_label = staticmethod(normalize_label)
    _extract_denomination = staticmethod(extract_denomination)
    _validate_denomination_by_color = staticmethod(validate_denomination_by_color)
    _validate_aspect_ratio = staticmethod(validate_aspect_ratio)
    _decode_base64_image = staticmethod(decode_base64_image)
    _is_blurry = staticmethod(is_blurry)
    _get_dominant_color = staticmethod(get_dominant_color)
    _get_spatial_position = staticmethod(get_spatial_position)
    _estimate_distance = staticmethod(estimate_distance)
    _find_clear_paths = staticmethod(find_clear_paths)
    _stabilize_caption = staticmethod(Stabilizer.stabilize_caption)
    _load_model = staticmethod(ModelManager.load_model)
    _detect = staticmethod(ModelManager.detect)
