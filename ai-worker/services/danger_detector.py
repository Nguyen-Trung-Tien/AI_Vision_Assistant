"""Real-time danger alert logic for normalized labels."""

from typing import Any

from .translations import t, translate_label
from .tracker import ObjectTracker

DANGER_LABELS = {
    "xe_lon",
    "xe_may",
    "xe_dap",
    "nap_cong",
    "o_ga",
    "cau_thang",
    "den_do",
    "den_xanh",
    "vat_can",
    "cot_dien",
    "thung_rac",
    "cay_co",
    "nguoi",
    "rao_chan",
}


def detect_dangers(
    client_id: str, detections: list[dict[str, Any]], threshold_m: float = 5.0, lang: str = "vi"
) -> list[dict[str, Any]]:
    alerts = []
    
    # 1. Update Tracker
    tracked_detections = ObjectTracker.update(client_id, detections)

    for obj in tracked_detections:
        label = obj.get("label")
        if not label:
            continue

        dist = obj.get("distance")
        if dist is None:
            continue
        d_min = float(dist)

        pos = obj.get("position", "center")
        pos_key = "position_left" if pos == "left" else "position_right" if pos == "right" else "position_front"
        pos_text = t(pos_key, lang)
        translated_label = translate_label(label, lang)

        vel_z = obj.get("velocity_z")
        vel_y = obj.get("velocity_y")

        # 2. Check for Traffic Lights
        if label in {"den_do", "den_xanh"}:
            if d_min <= threshold_m + 5.0:
                if label == "den_do":
                    message = t("tl_red_solution", lang, distance=round(d_min, 1))
                else:
                    message = t("tl_green_solution", lang, distance=round(d_min, 1))

                alerts.append(
                    {
                        "is_danger": True,
                        "label": translated_label,
                        "distance": round(d_min, 1),
                        "position": pos_text,
                        "message": message,
                        "center_x_ratio": obj.get("center_x_ratio"),
                    }
                )
            continue

        # 3. Check for Dynamic Dangers (Fast vehicle & Falling Object)
        is_dynamic_danger = False
        
        # Xe lao tới (velocity_z < -3.0 m/s ~ 10.8 km/h relative approach speed)
        if label in {"xe_may", "xe_lon", "xe_dap"} and vel_z is not None and vel_z < -3.0 and d_min <= threshold_m + 10.0:
            alerts.append({
                "is_danger": True,
                "label": translated_label,
                "distance": round(d_min, 1),
                "position": pos_text,
                "message": t(
                    "fast_vehicle",
                    lang,
                    label=translated_label,
                    position=pos_text.lower(),
                ),
                "center_x_ratio": obj.get("center_x_ratio"),
            })
            is_dynamic_danger = True

        # Vật rơi (velocity_y > 500 pixels/s - this depends on image size, but roughly speaking a fast drop)
        if vel_y is not None and vel_y > 500.0 and d_min <= threshold_m:
            alerts.append({
                "is_danger": True,
                "label": translated_label,
                "distance": round(d_min, 1),
                "position": pos_text,
                "message": t(
                    "falling_object",
                    lang,
                    label=translated_label,
                ),
                "center_x_ratio": obj.get("center_x_ratio"),
            })
            is_dynamic_danger = True

        if is_dynamic_danger:
            continue

        # 4. Check for Static Danger (Too close)
        if d_min <= threshold_m:
            alerts.append(
                {
                    "is_danger": True,
                    "label": translated_label,
                    "distance": round(d_min, 1),
                    "position": pos_text,
                    "message": t(
                        "danger_warning",
                        lang,
                        label=translated_label,
                        position=pos_text.lower(),
                        distance=round(d_min, 1),
                    ),
                    "center_x_ratio": obj.get("center_x_ratio"),
                }
            )

    alerts.sort(key=lambda x: x["distance"])
    return alerts
