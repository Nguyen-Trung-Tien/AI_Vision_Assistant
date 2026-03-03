"""
Temporal stabilization cho OCR và Captioning.
Lưu lịch sử kết quả theo client_id để tránh kết quả nhấp nháy.
Tự động dọn dẹp client không hoạt động sau TTL (mặc định 5 phút).
"""

import time
import threading
from collections import Counter


class Stabilizer:
    """Quản lý lịch sử kết quả nhận diện để đảm bảo tính ổn định."""

    _client_histories: dict[str, list] = {}
    _client_last_seen: dict[str, float] = {}
    _max_history: int = 5
    _ttl_seconds: float = 300.0  # 5 phút
    _lock = threading.RLock()  # Protect shared dicts from concurrent access

    @classmethod
    def _cleanup_stale_clients(cls) -> None:
        """Xóa lịch sử của những client không hoạt động quá TTL."""
        now = time.monotonic()
        with cls._lock:
            stale_keys = [
                key
                for key, last_seen in cls._client_last_seen.items()
                if now - last_seen > cls._ttl_seconds
            ]
            for key in stale_keys:
                cls._client_histories.pop(key, None)
                cls._client_last_seen.pop(key, None)

        if stale_keys:
            print(f"[Stabilizer] Cleaned up {len(stale_keys)} stale client(s)")

    @classmethod
    def _touch(cls, key: str) -> None:
        """Cập nhật thời gian hoạt động cuối cùng của client."""
        with cls._lock:
            cls._client_last_seen[key] = time.monotonic()

    @classmethod
    def stabilize_ocr(cls, client_id: str, denomination: str | None) -> bool:
        """
        Kiểm tra mệnh giá hiện tại có ổn định không
        (xuất hiện ít nhất 2 lần trong 5 frame gần nhất).
        """
        # Dọn dẹp định kỳ
        cls._cleanup_stale_clients()

        with cls._lock:
            if client_id not in cls._client_histories:
                cls._client_histories[client_id] = []

            cls._touch(client_id)

            history = cls._client_histories[client_id]
            history.append(denomination)
            if len(history) > cls._max_history:
                history.pop(0)

            counts = Counter(history)
            most_common_denom, count = counts.most_common(1)[0]

            if count >= 2 and most_common_denom is not None and most_common_denom != "None":
                return denomination == most_common_denom
            return False

    @classmethod
    def stabilize_caption(cls, client_id: str, scene_key: str) -> bool:
        """
        Kiểm tra cảnh hiện tại có ổn định không
        (xuất hiện ít nhất 2/5 lần gần nhất).
        """
        history_key = f"cap_{client_id}"

        with cls._lock:
            if history_key not in cls._client_histories:
                cls._client_histories[history_key] = []

            cls._touch(history_key)

            history = cls._client_histories[history_key]
            history.append(scene_key)
            if len(history) > cls._max_history:
                history.pop(0)

            counts = Counter(history)
            _, count = counts.most_common(1)[0]

            return count >= 2

    @classmethod
    def reset(cls) -> None:
        """Xóa toàn bộ lịch sử (dùng cho testing)."""
        with cls._lock:
            cls._client_histories.clear()
            cls._client_last_seen.clear()
