import base64
from array import array
from typing import Iterable


def as_bitmask(ids: Iterable[int], total: int):
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
