"""
TTS (Text-To-Speech) Cache Service.
Uses Redis for persistent cache, with in-memory LRU fallback.
"""

import hashlib
import os
import re
import subprocess
import threading
from collections import OrderedDict

try:
    import redis
    _redis_available = True
except ImportError:
    _redis_available = False


class _LRUCache:
    """Thread-safe LRU cache based on OrderedDict."""

    def __init__(self, maxsize: int = 512):
        self._cache: OrderedDict[str, str] = OrderedDict()
        self._maxsize = maxsize
        self._lock = threading.RLock()

    def get(self, key: str):
        with self._lock:
            if key not in self._cache:
                return None
            self._cache.move_to_end(key)
            return self._cache[key]

    def set(self, key: str, value: str) -> None:
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = value
            if len(self._cache) > self._maxsize:
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
    - Primary: Redis
    - Fallback: in-memory LRU
    """

    _redis_client = None
    _memory_cache: _LRUCache = _LRUCache(maxsize=512)
    _initialized = False
    _cache_ttl: int = 86400

    _audio_dir: str = os.getenv(
        "TTS_AUDIO_DIR",
        "/tmp/vision_audio" if os.name != "nt"
        else os.path.join(os.environ.get("TEMP", "C:\\temp"), "vision_audio"),
    )

    _VOICE_MAP: dict[str, str] = {
        "vi": "vi-VN-HoaiMyNeural",
        "en": "en-US-JennyNeural",
    }

    _VOICE_FALLBACKS: dict[str, list[str]] = {
        "vi": ["vi-VN-HoaiMyNeural", "vi-VN-NamMinhNeural", "en-US-JennyNeural"],
        "en": ["en-US-JennyNeural", "en-US-GuyNeural", "vi-VN-HoaiMyNeural"],
    }

    @classmethod
    def _init_redis(cls) -> None:
        if cls._initialized:
            return
        cls._initialized = True

        if not _redis_available:
            print("[TTS Cache] redis package not installed - using LRU memory cache")
            return

        redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
        try:
            cls._redis_client = redis.from_url(
                redis_url, decode_responses=True, socket_timeout=2
            )
            cls._redis_client.ping()
            print(f"[TTS Cache] Connected to Redis: {redis_url}")
        except Exception as exc:
            print(f"[TTS Cache] Redis unavailable ({exc}) - using LRU memory cache")
            cls._redis_client = None

    @classmethod
    def _make_cache_key(cls, text: str, lang: str = "vi") -> str:
        text_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
        return f"tts_audio_{text_hash}_{lang}"

    @classmethod
    def _normalize_tts_text(cls, text: str) -> str:
        if not text:
            return ""

        cleaned = re.sub(r"\s+", " ", str(text)).strip()
        cleaned = "".join(ch for ch in cleaned if ch.isprintable())

        # Keep payload short to reduce service-side failures.
        if len(cleaned) > 400:
            cleaned = cleaned[:400].rstrip()
        return cleaned

    @classmethod
    def _run_edge_tts(cls, text: str, voice: str, file_path: str) -> tuple[bool, str]:
        cmd = [
            "edge-tts",
            "--voice", voice,
            "--text", text,
            "--write-media", file_path,
        ]
        try:
            completed = subprocess.run(
                cmd,
                check=True,
                timeout=30,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            stderr_text = (completed.stderr or "").strip()
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                return True, stderr_text
            return False, stderr_text or "edge-tts produced empty output"
        except subprocess.TimeoutExpired:
            return False, "edge-tts timed out"
        except subprocess.CalledProcessError as exc:
            stderr_text = (exc.stderr or "").strip() if getattr(exc, "stderr", None) else ""
            return False, stderr_text or str(exc)
        except Exception as exc:
            return False, str(exc)

    @classmethod
    def _short_error(cls, error: str) -> str:
        if not error:
            return "unknown error"
        first_line = next((line.strip() for line in error.splitlines() if line.strip()), "")
        if len(first_line) > 220:
            first_line = first_line[:220].rstrip() + "..."
        return first_line or "unknown error"

    @classmethod
    def _generate_audio(cls, text: str, cache_key: str, lang: str = "vi") -> str:
        os.makedirs(cls._audio_dir, exist_ok=True)

        file_name = f"{cache_key}.mp3"
        file_path = os.path.join(cls._audio_dir, file_name)

        if not os.path.exists(file_path):
            normalized_text = cls._normalize_tts_text(text)
            if not normalized_text:
                print("[TTS Cache] Empty text after normalization")
                return ""

            voices = cls._VOICE_FALLBACKS.get(lang, [cls._VOICE_MAP.get(lang, "vi-VN-HoaiMyNeural")])
            voices = list(dict.fromkeys(voices))

            last_error = ""
            for voice in voices:
                ok, error = cls._run_edge_tts(normalized_text, voice, file_path)
                if ok:
                    print(f"[TTS Cache] Generated audio via voice={voice} -> {file_path}")
                    last_error = ""
                    break
                last_error = error
                print(f"[TTS Cache] edge-tts failed voice={voice}: {cls._short_error(error)}")

            if last_error:
                short_text = normalized_text[:180].rstrip()
                if short_text and short_text != normalized_text:
                    ok, error = cls._run_edge_tts(short_text, voices[0], file_path)
                    if ok:
                        print(f"[TTS Cache] Generated audio after short-text retry -> {file_path}")
                        last_error = ""
                    else:
                        last_error = error

            if last_error:
                return ""

        return f"/audio/{file_name}"

    @classmethod
    def get_audio_url(cls, text: str, lang: str = "vi") -> str:
        cls._init_redis()
        normalized_text = cls._normalize_tts_text(text)
        if not normalized_text:
            return ""

        cache_key = cls._make_cache_key(normalized_text, lang)

        if cls._redis_client is not None:
            try:
                cached_url = cls._redis_client.get(cache_key)
                if cached_url:
                    print(f"[TTS Cache] HIT (Redis): {cache_key}")
                    return cached_url
            except Exception as exc:
                print(f"[TTS Cache] Redis read error: {exc}")

        cached_url = cls._memory_cache.get(cache_key)
        if cached_url is not None:
            print(f"[TTS Cache] HIT (Memory LRU): {cache_key} | cache_size={len(cls._memory_cache)}")
            return cached_url

        audio_url = cls._generate_audio(normalized_text, cache_key, lang)

        if audio_url:
            if cls._redis_client is not None:
                try:
                    cls._redis_client.setex(cache_key, cls._cache_ttl, audio_url)
                    print(f"[TTS Cache] MISS -> stored in Redis: {cache_key}")
                except Exception as exc:
                    print(f"[TTS Cache] Redis write error: {exc}")

            cls._memory_cache.set(cache_key, audio_url)
            print(f"[TTS Cache] MISS -> stored in LRU Memory: {cache_key} | cache_size={len(cls._memory_cache)}")
        else:
            print(f"[TTS Cache] MISS -> audio generation failed: {cache_key}")

        return audio_url

    @classmethod
    def clear_cache(cls) -> None:
        cls._memory_cache.clear()
        print("[TTS Cache] LRU Memory cache cleared")

    @classmethod
    def get_audio_dir(cls) -> str:
        return cls._audio_dir
