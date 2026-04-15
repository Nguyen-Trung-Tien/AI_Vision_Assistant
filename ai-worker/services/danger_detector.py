"""Real-time danger alert logic for normalized labels."""

from typing import Any

from .translations import t, translate_label

DANGER_LABELS = {
    "xe_lon",
    "xe_may",
    "nap_cong",
    "o_ga",
    "cau_thang",
    "den_do",
    "den_xanh",
}


def detect_dangers(detections: list[dict[str, Any]], threshold_m: float = 2.0, lang: str = "vi") -> list[dict[str, Any]]:
    alerts = []

    for obj in detections:
        label = obj.get("label")
        if not label or label not in DANGER_LABELS:
            continue

        dist = obj.get("distance")
        if dist is None:
            continue
        d_min = float(dist)

        pos = obj.get("position", "center")
        pos_key = "position_left" if pos == "left" else "position_right" if pos == "right" else "position_front"
        pos_text = t(pos_key, lang)
        translated_label = translate_label(label, lang)

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
