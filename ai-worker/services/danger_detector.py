"""
Hệ thống nhận diện cảnh báo nguy hiểm thời gian thực.
"""
from typing import Any
from services.translations import t, translate_label

DANGER_LABELS = {"car", "motorcycle", "bus", "truck", "bicycle", "dog"}

def detect_dangers(detections: list[dict[str, Any]], threshold_m: float = 2.0, lang: str = "vi") -> list[dict[str, Any]]:
    alerts = []
    
    for obj in detections:
        label = obj.get('label')
        if not label or label not in DANGER_LABELS:
            continue
            
        distances = obj.get('distances', {})
        if not distances:
            # Fallback simple distance if missing from scene_captioner
            dist = obj.get('distance')
            if not dist:
                continue
            d_min = dist
        else:
            valid_dist = [d for d in [distances.get("left"), distances.get("center"), distances.get("right")] if d is not None]
            if not valid_dist:
                continue
            d_min = min(valid_dist)
            
        if d_min <= threshold_m:
            pos = obj.get('position', 'center')
            if pos == 'left':
                pos_key = "position_left"
            elif pos == 'right':
                pos_key = "position_right"
            else:
                pos_key = "position_front"
                
            pos_text = t(pos_key, lang)
            translated_label = translate_label(label, lang)
            
            alerts.append({
                "is_danger": True,
                "label": translated_label,
                "distance": round(d_min, 1),
                "position": pos_text,
                "message": t("danger_warning", lang, label=translated_label, position=pos_text.lower(), distance=round(d_min, 1))
            })
            
    # Sort alerts by closest first
    alerts.sort(key=lambda x: x['distance'])
    return alerts
