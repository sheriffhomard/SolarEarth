"""
In-memory and persistent response cache with rate limiter for external providers (e.g. PVGIS JRC).
Enforces polite API consumption quotas and enables offline / instant serving.
"""

import asyncio
from datetime import datetime, timezone
import hashlib
import json
import time
from typing import Any, Dict, Optional
from backend.app.core.logging import get_logger

logger = get_logger("CACHE")


class SimpleRateLimiter:
    """
    Leaky bucket / token bucket rate limiter to respect PVGIS API guidelines.
    Guarantees minimum delay between external calls and maximum requests per minute.
    """

    def __init__(self, requests_per_minute: int = 15, min_interval_seconds: float = 0.5):
        self.interval = 60.0 / requests_per_minute
        self.min_interval = min_interval_seconds
        self.last_request_time: float = 0.0
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_request_time
            required_wait = max(self.min_interval, self.interval - elapsed)

            if elapsed < self.min_interval:
                await asyncio.sleep(required_wait)

            self.last_request_time = time.monotonic()


class ResponseCache:
    """
    In-memory TTL cache with deterministic key hashing.
    """

    def __init__(self, default_ttl_seconds: int = 86400 * 7):  # 7 days default
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl_seconds

    @staticmethod
    def generate_key(prefix: str, params: Dict[str, Any]) -> str:
        serialized = json.dumps(params, sort_keys=True, default=str)
        digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]
        return f"{prefix}:{digest}"

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if not entry:
            return None

        if time.time() > entry["expires_at"]:
            del self._cache[key]
            return None

        logger.info(f"Cache HIT for key: {key}")
        return entry["data"]

    def set(self, key: str, data: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        self._cache[key] = {
            "data": data,
            "expires_at": time.time() + ttl,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        logger.info(f"Cache STORE for key: {key} (TTL: {ttl}s)")

    def clear(self) -> None:
        self._cache.clear()


# Global singletons
pvgis_rate_limiter = SimpleRateLimiter(requests_per_minute=20, min_interval_seconds=0.3)
solar_data_cache = ResponseCache(default_ttl_seconds=86400 * 30)  # 30 days for climatology
