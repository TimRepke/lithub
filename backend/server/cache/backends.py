import abc
import time
from asyncio import Lock
from dataclasses import dataclass

from ..logging import get_logger
from ..config import settings

logger = get_logger('cache.backend')


@dataclass
class Value:
    data: bytes
    ttl_ts: int | None
    ts: int


class Backend(abc.ABC):
    @abc.abstractmethod
    async def get_with_ttl(self, key: str) -> tuple[int | None, bytes | None]:
        raise NotImplementedError

    @abc.abstractmethod
    async def get(self, key: str) -> bytes | None:
        raise NotImplementedError

    @abc.abstractmethod
    async def set(self, key: str, value: bytes, expire: int | None = None) -> None:
        raise NotImplementedError

    @abc.abstractmethod
    async def clear(self, namespace: str | None = None, key: str | None = None) -> int:
        raise NotImplementedError


class InMemoryBackend(Backend):
    _store: dict[str, Value] = {}
    _size: int = 0
    _lock = Lock()

    @property
    def _now(self) -> int:
        return int(time.time())

    def _get(self, key: str) -> Value | None:
        v = self._store.get(key)
        if v:
            if v.ttl_ts is not None and v.ttl_ts < self._now:
                del self._store[key]
            else:
                return v
        return None

    async def get_with_ttl(self, key: str) -> tuple[int | None, bytes | None]:
        async with self._lock:
            v = self._get(key)
            if v and v.ttl_ts is not None:
                return v.ttl_ts - self._now, v.data
            if v:
                return None, v.data
            return 0, None

    async def get(self, key: str) -> bytes | None:
        async with self._lock:
            v = self._get(key)
            if v:
                return v.data
            return None

    def _ensure_capacity(self, new_value: bytes):
        headroom = settings.CACHE_LIMIT - self._size - len(new_value)
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

    async def set(self, key: str, value: bytes, expire: int | None = None) -> None:
        async with self._lock:
            self._ensure_capacity(value)
            self._store[key] = Value(data=value, ttl_ts=None if expire is None else self._now + expire, ts=self._now)

    async def clear(self, namespace: str | None = None, key: str | None = None) -> int:
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
