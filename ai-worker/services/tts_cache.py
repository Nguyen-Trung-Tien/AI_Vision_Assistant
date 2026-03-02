"""
TTS (Text-To-Speech) Cache Service.
Sử dụng Redis để cache URL audio, tránh tạo lại TTS cho cùng nội dung.
Fallback sang in-memory cache khi Redis không khả dụng.
"""

import hashlib
import os
import subprocess

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
    def _make_cache_key(cls, text: str, lang: str = "vi") -> str:
        """Tạo cache key từ nội dung text và ngôn ngữ."""
        text_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
        return f"tts_audio_{text_hash}_{lang}"

    # Map ngôn ngữ sang giọng edge-tts
    _VOICE_MAP: dict[str, str] = {
        "vi": "vi-VN-HoaiMyNeural",
        "en": "en-US-JennyNeural",
    }

    @classmethod
    def _generate_audio_url(cls, text: str, cache_key: str, lang: str = "vi") -> str:
        """
        Tạo URL audio từ TTS engine (edge-tts).
        Lưu file trả về dạng URL cục bộ hoặc public tùy cấu hình.
        """
        # Thư mục lưu trữ tạm thời
        audio_dir = "/tmp/vision_audio" if os.name != "nt" else os.path.join(os.environ.get("TEMP", "C:\\temp"), "vision_audio")
        os.makedirs(audio_dir, exist_ok=True)

        file_name = f"{cache_key}.mp3"
        file_path = os.path.join(audio_dir, file_name)

        if not os.path.exists(file_path):
            try:
                # Gọi edge-tts qua subprocess cli
                voice = cls._VOICE_MAP.get(lang, "vi-VN-HoaiMyNeural")
                cmd = ["edge-tts", "--voice", voice, "--text", text, "--write-media", file_path]
                subprocess.run(cmd, check=True)
                print(f"[TTS Cache] Generated new audio at {file_path}")
            except Exception as e:
                print(f"[TTS Cache] Error generating edge-tts: {e}")
                return ""

        # Trong thực tế, bạn cần một static file server (FastAPI/Express/Nginx) map tới thư mục này.
        # Hoặc backend-gateway sẽ proxy file này.
        # Ở đây trả về relative path để Gateway hoặc Client tự xử lý:
        return f"/audio/{file_name}"

    @classmethod
    def get_audio_url(cls, text: str, lang: str = "vi") -> str:
        """
        Lấy audio URL cho text.
        Cache Hit → trả URL đã lưu.
        Cache Miss → tạo mới, lưu cache, trả URL.
        """
        cls._init_redis()

        cache_key = cls._make_cache_key(text, lang)

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
        audio_url = cls._generate_audio_url(text, cache_key, lang)

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
