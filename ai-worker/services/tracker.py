"""
Theo dõi vật thể qua các frame để tính toán vận tốc (chuyển động tiến lại gần hoặc rơi).
"""
import time
import threading
from typing import TypedDict

class TrackedObject(TypedDict):
    id: int
    label: str
    box: list[int]
    distance: float | None
    last_seen: float
    velocity_z: float | None  # m/s (âm = tiến lại gần)
    velocity_y: float | None  # pixel/s (dương = đi xuống)
    history_z: list[tuple[float, float]]  # (time, distance)
    history_y: list[tuple[float, float]]  # (time, y_center)


class ObjectTracker:
    _client_tracks: dict[str, list[TrackedObject]] = {}
    _client_last_seen: dict[str, float] = {}
    _next_id: int = 1
    _ttl_seconds: float = 60.0  # 1 phút không hoạt động thì xóa
    _lock = threading.RLock()
    
    # Constants
    MAX_HISTORY = 5
    IOU_THRESHOLD = 0.3
    
    @classmethod
    def _calculate_iou(cls, boxA: list[int], boxB: list[int]) -> float:
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

        iou = interArea / float(boxAArea + boxBArea - interArea) if (boxAArea + boxBArea - interArea) > 0 else 0
        return iou

    @classmethod
    def _cleanup_stale_clients(cls) -> None:
        now = time.monotonic()
        with cls._lock:
            stale_keys = [key for key, last in cls._client_last_seen.items() if now - last > cls._ttl_seconds]
            for key in stale_keys:
                cls._client_tracks.pop(key, None)
                cls._client_last_seen.pop(key, None)

    @classmethod
    def update(cls, client_id: str, detections: list[dict]) -> list[dict]:
        """
        Cập nhật trạng thái tracker với list detections mới.
        Trả về detections được bổ sung velocity_z và velocity_y.
        """
        cls._cleanup_stale_clients()
        now = time.monotonic()
        
        with cls._lock:
            cls._client_last_seen[client_id] = now
            if client_id not in cls._client_tracks:
                cls._client_tracks[client_id] = []
                
            current_tracks = cls._client_tracks[client_id]
            new_tracks: list[TrackedObject] = []
            
            # Khớp các detection mới với track cũ
            matched_tracks = set()
            
            for det in detections:
                box = det["box"]
                label = det["label"]
                dist = det.get("distance")
                
                best_iou = cls.IOU_THRESHOLD
                best_track_idx = -1
                
                # Tìm track cũ khớp nhất (cùng label và IOU cao nhất)
                for i, track in enumerate(current_tracks):
                    if track["label"] == label and i not in matched_tracks:
                        iou = cls._calculate_iou(box, track["box"])
                        if iou > best_iou:
                            best_iou = iou
                            best_track_idx = i
                
                y_center = (box[1] + box[3]) / 2.0
                
                if best_track_idx != -1:
                    # Update track cũ
                    track = current_tracks[best_track_idx]
                    matched_tracks.add(best_track_idx)
                    
                    track["box"] = box
                    track["distance"] = dist
                    track["last_seen"] = now
                    
                    if dist is not None:
                        track["history_z"].append((now, dist))
                        if len(track["history_z"]) > cls.MAX_HISTORY:
                            track["history_z"].pop(0)
                    
                    track["history_y"].append((now, y_center))
                    if len(track["history_y"]) > cls.MAX_HISTORY:
                        track["history_y"].pop(0)
                        
                    # Tính toán velocity
                    if len(track["history_z"]) >= 2:
                        t1, z1 = track["history_z"][0]
                        t2, z2 = track["history_z"][-1]
                        dt = t2 - t1
                        if dt > 0:
                            track["velocity_z"] = (z2 - z1) / dt
                    
                    if len(track["history_y"]) >= 2:
                        t1, y1 = track["history_y"][0]
                        t2, y2 = track["history_y"][-1]
                        dt = t2 - t1
                        if dt > 0:
                            track["velocity_y"] = (y2 - y1) / dt
                            
                    new_tracks.append(track)
                    det["velocity_z"] = track["velocity_z"]
                    det["velocity_y"] = track["velocity_y"]
                    det["track_id"] = track["id"]
                else:
                    # Tạo track mới
                    history_z = [(now, dist)] if dist is not None else []
                    new_track = TrackedObject(
                        id=cls._next_id,
                        label=label,
                        box=box,
                        distance=dist,
                        last_seen=now,
                        velocity_z=None,
                        velocity_y=None,
                        history_z=history_z,
                        history_y=[(now, y_center)]
                    )
                    cls._next_id += 1
                    new_tracks.append(new_track)
                    det["velocity_z"] = None
                    det["velocity_y"] = None
                    det["track_id"] = new_track["id"]
                    
            cls._client_tracks[client_id] = new_tracks
            
        return detections

    @classmethod
    def reset(cls) -> None:
        with cls._lock:
            cls._client_tracks.clear()
            cls._client_last_seen.clear()
