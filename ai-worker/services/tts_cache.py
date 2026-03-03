"""
TTS (Text-To-Speech) Cache Service.
Sử dụng Redis để cache URL audio, tránh tạo lại TTS cho cùng nội dung.
Fallback sang LRU in-memory cache (tối đa MAX_MEMORY_ITEMS entries) khi Redis không khả dụng.
"""

import hashlib
import os
import subprocess
import threading
from collections import OrderedDict

try:
    import redis
    _redis_available = True
except ImportError:
    _redis_available = False


class _LRUCache:
    """Thread-safe LRU cache dựa trên OrderedDict."""

    def __init__(self, maxsize: int = 512):
        self._cache: OrderedDict[str, str] = OrderedDict()
        self._maxsize = maxsize
        self._lock = threading.RLock()

    def get(self, key: str):
        with self._lock:
            if key not in self._cache:
                return None
            # Move to end (most recently used)
            self._cache.move_to_end(key)
            return self._cache[key]

    def set(self, key: str, value: str) -> None:
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = value
            if len(self._cache) > self._maxsize:
                # Evict oldest
                evicted = next(iter(self._cache))
                del self._cache[evicted]

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

    def __len__(self) -> int:
        return len(self._cache)


class TTSCacheService:
    """
    Cache TTS audio URLs.
    - Production: Redis cache
    - Fallback:   LRU in-memory dict (tối đa 512 entries, evict oldest khi đầy)
    """

    _redis_client = None
    _memory_cache: _LRUCache = _LRUCache(maxsize=512)
    _initialized = False
    _cache_ttl: int = 86400  # 24 giờ

    # Audio directory — configurable via env
    _audio_dir: str = os.getenv(
        "TTS_AUDIO_DIR",
        "/tmp/vision_audio" if os.name != "nt"
        else os.path.join(os.environ.get("TEMP", "C:\\temp"), "vision_audio"),
    )

    # Map ngôn ngữ sang giọng edge-tts
    _VOICE_MAP: dict[str, str] = {
        "vi": "vi-VN-HoaiMyNeural",
        "en": "en-US-JennyNeural",
    }

    @classmethod
    def _init_redis(cls) -> None:
        """Lazy-init Redis connection."""
        if cls._initialized:
            return
        cls._initialized = True

        if not _redis_available:
            print("[TTS Cache] redis package not installed — using LRU memory cache")
            return

        redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
        try:
            cls._redis_client = redis.from_url(
                redis_url, decode_responses=True, socket_timeout=2
            )
            cls._redis_client.ping()
            print(f"[TTS Cache] Connected to Redis: {redis_url}")
        except Exception as exc:
            print(f"[TTS Cache] Redis unavailable ({exc}) — using LRU memory cache")
            cls._redis_client = None

    @classmethod
    def _make_cache_key(cls, text: str, lang: str = "vi") -> str:
        """Tạo cache key từ nội dung text và ngôn ngữ."""
        text_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
        return f"tts_audio_{text_hash}_{lang}"

    @classmethod
    def _generate_audio(cls, text: str, cache_key: str, lang: str = "vi") -> str:
        """
        Tạo file MP3 bằng edge-tts và trả về URL path tương đối.

        URL format: /audio/<filename>.mp3
        → Backend-gateway (hoặc `main.py` FastAPI) phải mount static dir
          tại GET /audio/* → audio_dir.
        """
        os.makedirs(cls._audio_dir, exist_ok=True)

        file_name = f"{cache_key}.mp3"
        file_path = os.path.join(cls._audio_dir, file_name)

        if not os.path.exists(file_path):
            try:
                voice = cls._VOICE_MAP.get(lang, "vi-VN-HoaiMyNeural")
                cmd = [
                    "edge-tts",
                    "--voice", voice,
                    "--text", text,
                    "--write-media", file_path,
                ]
                subprocess.run(cmd, check=True, timeout=30)
                print(f"[TTS Cache] Generated audio → {file_path}")
            except subprocess.TimeoutExpired:
                print("[TTS Cache] edge-tts timed out")
                return ""
            except Exception as exc:
                print(f"[TTS Cache] edge-tts error: {exc}")
                return ""

        return f"/audio/{file_name}"

    @classmethod
    def get_audio_url(cls, text: str, lang: str = "vi") -> str:
        """
        Lấy audio URL cho text.
        Cache Hit  → trả URL đã lưu.
        Cache Miss → tạo mới, lưu cache, trả URL.
        """
        cls._init_redis()
        cache_key = cls._make_cache_key(text, lang)

        # 1. Try Redis
        if cls._redis_client is not None:
            try:
                cached_url = cls._redis_client.get(cache_key)
                if cached_url:
                    print(f"[TTS Cache] HIT (Redis): {cache_key}")
                    return cached_url
            except Exception as exc:
                print(f"[TTS Cache] Redis read error: {exc}")

        # 2. Try LRU memory cache
        cached_url = cls._memory_cache.get(cache_key)
        if cached_url is not None:
            print(f"[TTS Cache] HIT (Memory LRU): {cache_key} | cache_size={len(cls._memory_cache)}")
            return cached_url

        # 3. Cache Miss — generate
        audio_url = cls._generate_audio(text, cache_key, lang)

        # Store in Redis
        if cls._redis_client is not None:
            try:
                cls._redis_client.setex(cache_key, cls._cache_ttl, audio_url)
                print(f"[TTS Cache] MISS → stored in Redis: {cache_key}")
            except Exception as exc:
                print(f"[TTS Cache] Redis write error: {exc}")

        # Always store in LRU memory as fallback
        cls._memory_cache.set(cache_key, audio_url)
        print(f"[TTS Cache] MISS → stored in LRU Memory: {cache_key} | cache_size={len(cls._memory_cache)}")

        return audio_url

    @classmethod
    def clear_cache(cls) -> None:
        """Xóa toàn bộ memory cache."""
        cls._memory_cache.clear()
        print("[TTS Cache] LRU Memory cache cleared")

    @classmethod
    def get_audio_dir(cls) -> str:
        """Trả về thư mục chứa file audio (để mount static server)."""
        return cls._audio_dir
