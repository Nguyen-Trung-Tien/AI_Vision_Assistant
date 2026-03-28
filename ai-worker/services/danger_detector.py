"""
Hệ thống nhận diện cảnh báo nguy hiểm thời gian thực.
"""
from typing import Any
from .translations import t, translate_label

DANGER_LABELS = {
    "car",
    "truck",
    "bus",
    "motorbike",
    "manhole",
    "open_manhole",
    "pothole",
    "stairs_down",
    "stairs_up",
    "traffic_light_red",
    "traffic_light_yellow",
    "traffic_light_green",
}

def detect_dangers(detections: list[dict[str, Any]], threshold_m: float = 2.0, lang: str = "vi") -> list[dict[str, Any]]:
    alerts = []

    for obj in detections:
        label = obj.get('label')
        
        # Traffic light specific logic
        if label in ["traffic_light_red", "traffic_light_yellow", "traffic_light_green"]:
            dist = obj.get('distance')
            if dist is None: continue
            d_min = float(dist)
            
            if d_min <= threshold_m + 5.0:  # Detect traffic lights from further away (up to +5m)
                pos = obj.get('position', 'center')
                pos_key = "position_left" if pos == 'left' else "position_right" if pos == 'right' else "position_front"
                pos_text = t(pos_key, lang)
                
                is_danger = False
                if label == "traffic_light_red":
                    msg = t("tl_red_solution", lang, position=pos_text.lower(), distance=round(d_min, 1))
                    is_danger = True
                elif label == "traffic_light_yellow":
                    msg = t("tl_yellow_solution", lang, position=pos_text.lower(), distance=round(d_min, 1))
                    is_danger = True
                else: # green light is safe, but we inform the user
                    msg = t("tl_green_solution", lang, position=pos_text.lower(), distance=round(d_min, 1))
                    is_danger = False
                
                alerts.append({
                    "is_danger": is_danger,
                    "label": translate_label(label, lang),
                    "distance": round(d_min, 1),
                    "position": pos_text,
                    "message": msg
                })
            continue

        if not label or label not in DANGER_LABELS:
            continue

        # scene_captioner.py attaches 'distance' (singular float) — use it directly.
        # The old 'distances' dict branch was dead code that caused all alerts to be dropped.
        dist = obj.get('distance')
        if dist is None:
            continue
        d_min = float(dist)
            
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
