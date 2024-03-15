from datetime import date

import toml
import base64
import sqlite3
import logging
from array import array
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ValidationError

from ..utils.config import settings

logger = logging.getLogger('util.datasets')


class SchemeLabelValue(BaseModel):
    name: str
    value: bool | int


class SchemeLabel(BaseModel):
    name: str
    key: str
    type: Literal['single', 'bool', 'multi']
    values: list[SchemeLabelValue]


class DatasetInfo(BaseModel):
    name: str
    teaser: str
    description: str

    authors: list[str] | None = None
    contributors: list[str] | None = None

    created_date: date
    last_update: date

    figure: str | None = None

    db_filename: str
    arrow_file: str
    keywords_file: str | None = None

    scheme: dict[str, SchemeLabel]


class Dataset:
    def __init__(self, info: DatasetInfo, path: Path, key: str):
        self.key = key
        self.info = info
        self.db_file = path / info.db_filename
        self._total: int | None = None

    @property
    def total(self):
        if self._total is None:
            with self.__enter__() as db:
                logger.debug(f'Loading size of dataset for {self.key}')
                rslt = db.cur.execute('SELECT COUNT(1) as total FROM abstracts;').fetchone()
                self._total = rslt['total']
        return self._total

    def __enter__(self):
        self.con: sqlite3.Connection = sqlite3.connect(self.db_file)
        self.con.row_factory = sqlite3.Row
        self.con.set_trace_callback(logger.debug)
        self.cur: sqlite3.Cursor = self.con.cursor()

        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.con.close()


def get_bitmask(ids: list[int], total: int):
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


class DatasetCache:

    def __init__(self, base_path: Path):
        self.base_path = base_path
        self.datasets: dict[str, Dataset] = {}

    def reload(self):
        # Reset list of datasets
        self.datasets = {}
        # Iterate the dataset folder
        for entry in self.base_path.iterdir():
            # Only consider folders (excl. those starting with ".") that contain a 'info.toml' file
            if entry.is_dir() and not entry.name.startswith('.') and (entry / 'info.toml').exists():
                try:
                    with open(entry / 'info.toml', 'r') as f:
                        # Read meta-data from info file
                        info = DatasetInfo.model_validate(toml.loads(f.read()))

                    # verify files exist
                    if not (entry / info.db_filename).exists():
                        logger.warning(f'Dataset in {entry} is missing db_filename; ignoring dataset!')
                        continue
                    if not (entry / info.arrow_file).exists():
                        logger.warning(f'Dataset in {entry} is missing arrow_file; ignoring dataset!')
                        continue
                    if not info.get('keywords_file') is not None or not (entry / info['keywords_file']).exists():
                        logger.warning(f'Dataset in {entry} is missing keywords_file!')

                    # Append to list of known datasets
                    dataset = Dataset(info=info, key=entry.name, path=entry.absolute())
                    self.datasets[dataset.key] = dataset

                    # Log this (indirectly also fetches the dataset size from the database)
                    logger.info(f'Loaded {entry} with {dataset.total:,} documents.')

                except ValidationError as e:
                    logger.warning(f'Failed to validate dataset info at {entry}')
                    logger.exception(e)


datasets = DatasetCache(base_path=Path(settings.DATASETS_FOLDER))
datasets.reload()

__all__ = ['get_bitmask', 'datasets', 'Dataset', 'DatasetInfo']

# DROP TABLE search;
# CREATE VIRTUAL TABLE search USING fts5(id, title, "text", authors);
# INSERT INTO search (id, title, "text", authors) SELECT "index", title, "text", authors FROM abstracts;
# SELECT id, highlight(search, 2, '<b>', '</b>') FROM search('calif* AND low');
