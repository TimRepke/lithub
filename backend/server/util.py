import base64
from array import array
from typing import Iterable, TypeVar


def as_bitmask(ids: Iterable[int], total: int) -> bytes:
    # https://wiki.python.org/moin/BitArrays
    intSize = total >> 5  # number of 32 bit integers
    if total & 31:  # if bitSize != (32 * n) add
        intSize += 1  # a record for stragglers
    bitmask = array('I')  # 'I' = unsigned 32-bit integer
    bitmask.extend((0,) * intSize)

    def set_bit(idx):
        record = idx >> 5
        offset = idx & 31
        mask = 1 << offset
        bitmask[record] |= mask

    [set_bit(idx_) for idx_ in ids]
    return base64.b64encode(bitmask)


def as_ids(bitmask_str: str):
    bitmask = array('I', base64.b64decode(bitmask_str))

    def is_set(idx):
        record = idx >> 5
        offset = idx & 31
        mask = 1 << offset
        return bool(bitmask[record] & mask)

    return [idx for idx in range(len(bitmask) * 32) if is_set(idx)]


def as_ids_lim(bitmask_str: str, limit: int | None = None):
    """
    Same as `as_ids`, but it will stop after it found `limit` ids.
    In case you don't need them all, this saves memory and may have some speed benefits.

    :param bitmask_str:
    :param limit:
    :return:
    """
    bitmask = array('I', base64.b64decode(bitmask_str))
    if limit is None:
        limit = len(bitmask) * 32

    def is_set(idx):
        record = idx >> 5
        offset = idx & 31
        mask = 1 << offset
        return bool(bitmask[record] & mask)

    def gen():
        cnt = 0
        for idx in range(len(bitmask) * 32):
            if is_set(idx):
                yield idx
                if cnt > limit:
                    break

    return [idx for idx in gen()]


T = TypeVar('T')


def as_batches(it: Iterable[T], batch_size: int) -> Iterable[list[T]]:
    batch = []
    for item in it:
        batch.append(item)
        if len(batch) >= batch_size:
            yield batch
            batch = []
    yield batch
