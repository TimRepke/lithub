import abc
import time
import logging
from asyncio import Lock
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

logger = logging.getLogger('cache.backend')


@dataclass
class Value:
    data: bytes
    ttl_ts: int
    ts: int


CACHE_LIMIT = 1024 * 1024 * 128  # Maximum cache size is 128MB


class Backend(abc.ABC):
    @abc.abstractmethod
    async def get_with_ttl(self, key: str) -> Tuple[int, Optional[bytes]]:
        raise NotImplementedError

    @abc.abstractmethod
    async def get(self, key: str) -> Optional[bytes]:
        raise NotImplementedError

    @abc.abstractmethod
    async def set(self, key: str, value: bytes, expire: Optional[int] = None) -> None:
        raise NotImplementedError

    @abc.abstractmethod
    async def clear(self, namespace: Optional[str] = None, key: Optional[str] = None) -> int:
        raise NotImplementedError


class InMemoryBackend(Backend):
    _store: Dict[str, Value] = {}
    _size: int = 0
    _lock = Lock()

    @property
    def _now(self) -> int:
        return int(time.time())

    def _get(self, key: str) -> Optional[Value]:
        v = self._store.get(key)
        if v:
            if v.ttl_ts < self._now:
                del self._store[key]
            else:
                return v
        return None

    async def get_with_ttl(self, key: str) -> Tuple[int, Optional[bytes]]:
        async with self._lock:
            v = self._get(key)
            if v:
                return v.ttl_ts - self._now, v.data
            return 0, None

    async def get(self, key: str) -> Optional[bytes]:
        async with self._lock:
            v = self._get(key)
            if v:
                return v.data
            return None

    def _ensure_capacity(self, new_value: bytes):
        headroom = CACHE_LIMIT - self._size - len(new_value)
        if headroom < 0:
            logger.info(f'Cache is full, overhead is {headroom}')
            # sort by age and keep deleting the oldest entries until enough space is there
            for key in sorted(self._store.keys(), key=lambda k: self._store[k].ts):
                headroom += len(self._store[key].data)
                del self._store[key]
                logger.info(f'Dropping cache entry to make space: {key}')

                # we now have enough space again, stop here
                if headroom >= 0:
                    break

    async def set(self, key: str, value: bytes, expire: Optional[int] = None) -> None:
        async with self._lock:
            self._ensure_capacity(value)
            self._store[key] = Value(value, self._now + (expire or 0), self._now)

    async def clear(self, namespace: Optional[str] = None, key: Optional[str] = None) -> int:
        count = 0
        if namespace:
            keys = list(self._store.keys())
            for key in keys:
                if key.startswith(namespace):
                    del self._store[key]
                    count += 1
        elif key:
            del self._store[key]
            count += 1
        return count
