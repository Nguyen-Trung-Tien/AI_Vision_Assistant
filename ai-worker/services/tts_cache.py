"""
TTS (Text-To-Speech) Cache Service.
Sử dụng Redis để cache URL audio, tránh tạo lại TTS cho cùng nội dung.
Fallback sang in-memory cache khi Redis không khả dụng.
"""

import hashlib
import os
from typing import Optional

try:
    import redis

    _redis_available = True
except ImportError:
    _redis_available = False


class TTSCacheService:
    """
    Cache TTS audio URLs.
    - Production: Redis cache
    - Fallback: In-memory dict (khi Redis không có sẵn hoặc bị lỗi)
    """

    _redis_client = None
    _memory_cache: dict[str, str] = {}
    _initialized = False
    _cache_ttl: int = 86400  # 24 giờ

    @classmethod
    def _init_redis(cls) -> None:
        """Lazy-init Redis connection."""
        if cls._initialized:
            return
        cls._initialized = True

        if not _redis_available:
            print("[TTS Cache] redis package not installed — using memory cache")
            return

        redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
        try:
            cls._redis_client = redis.from_url(
                redis_url, decode_responses=True, socket_timeout=2
            )
            cls._redis_client.ping()
            print(f"[TTS Cache] Connected to Redis: {redis_url}")
        except Exception as exc:
            print(f"[TTS Cache] Redis unavailable ({exc}) — using memory cache")
            cls._redis_client = None

    @classmethod
    def _make_cache_key(cls, text: str) -> str:
        """Tạo cache key từ nội dung text."""
        text_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
        return f"tts_audio:{text_hash}:vi-VN"

    @classmethod
    def _generate_audio_url(cls, cache_key: str) -> str:
        """
        Tạo URL audio từ TTS engine.
        TODO: Tích hợp Google Cloud TTS hoặc edge-tts thực tế.
        Hiện tại trả URL giả định từ S3.
        """
        return f"https://s3.aws.abc/vision-assistant/{cache_key}.mp3"

    @classmethod
    def get_audio_url(cls, text: str) -> str:
        """
        Lấy audio URL cho text.
        Cache Hit → trả URL đã lưu.
        Cache Miss → tạo mới, lưu cache, trả URL.
        """
        cls._init_redis()

        cache_key = cls._make_cache_key(text)

        # Try Redis first
        if cls._redis_client is not None:
            try:
                cached_url = cls._redis_client.get(cache_key)
                if cached_url:
                    print(f"[TTS Cache] HIT (Redis): {cache_key}")
                    return cached_url
            except Exception as exc:
                print(f"[TTS Cache] Redis read error: {exc}")

        # Try memory cache
        if cache_key in cls._memory_cache:
            print(f"[TTS Cache] HIT (Memory): {cache_key}")
            return cls._memory_cache[cache_key]

        # Cache Miss — generate
        audio_url = cls._generate_audio_url(cache_key)

        # Store in Redis
        if cls._redis_client is not None:
            try:
                cls._redis_client.setex(cache_key, cls._cache_ttl, audio_url)
                print(f"[TTS Cache] MISS → stored in Redis: {cache_key}")
            except Exception as exc:
                print(f"[TTS Cache] Redis write error: {exc}")

        # Always store in memory as fallback
        cls._memory_cache[cache_key] = audio_url

        return audio_url

    @classmethod
    def clear_cache(cls) -> None:
        """Xóa toàn bộ memory cache."""
        cls._memory_cache.clear()
        print("[TTS Cache] Memory cache cleared")
