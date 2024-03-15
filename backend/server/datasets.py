from datetime import date

import toml
import sqlite3
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ValidationError, ConfigDict

from .logging import get_logger
from .config import settings

logger = get_logger('util.datasets')


class SchemeLabelValue(BaseModel):
    name: str
    value: bool | int


class SchemeLabel(BaseModel):
    name: str
    key: str
    type: Literal['single', 'bool', 'multi']
    values: list[SchemeLabelValue]


class DatasetInfo(BaseModel):
    model_config = ConfigDict(extra='ignore')

    name: str
    teaser: str
    # description: str

    #  authors: list[str] | None = None
    # contributors: list[str] | None = None

    created_date: date
    last_update: date

    # figure: str | None = None


class DatasetInfoFull(DatasetInfo):
    model_config = ConfigDict(extra='ignore')
    db_filename: str
    arrow_filename: str
    keywords_filename: str | None = None

    scheme: dict[str, SchemeLabel]


class DatasetInfoWeb(DatasetInfoFull):
    model_config = ConfigDict(extra='ignore')
    key: str
    total: int
    columns: set[str]


class Dataset:
    def __init__(self, info: DatasetInfoFull, path: Path, key: str):
        self.key = key
        self._info = info
        self.db_file = path / info.db_filename
        self.logger = get_logger(f'util.db.{key}')
        self._total: int | None = None
        self._columns: set[str] | None = None

    @property
    def info(self) -> DatasetInfoWeb:
        return DatasetInfoWeb(
            key=self.key,
            total=self.total,
            columns=self.columns,
            **self._info.dict())

    @property
    def total(self) -> int:
        if self._total is None:
            try:
                with self as db:
                    logger.debug(f'Loading size of dataset for {self.key}')
                    rslt = db.cur.execute('SELECT COUNT(1) as total FROM documents;').fetchone()
                    self._total = rslt['total']
            except:
                return 0
        return self._total

    @property
    def columns(self) -> set[str]:
        if self._columns is None:
            with self as db:
                logger.debug(f'Loading columns for {self.key}')
                rslt = db.cur.execute('PRAGMA table_info(documents);').fetchall()
                self._columns = set([r['name'] for r in rslt])
        return self._columns

    def safe_col(self, col: str):
        if col not in self.columns:
            raise ValueError(f'Invalid column name: {col}')
        return f'"{col}"'

    def __enter__(self):
        self.con: sqlite3.Connection = sqlite3.connect(self.db_file)
        self.con.row_factory = sqlite3.Row
        self.con.set_trace_callback(self.logger.debug)
        self.cur: sqlite3.Cursor = self.con.cursor()

        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.con.close()


class DatasetCache:

    def __init__(self, base_path: Path):
        logger.info(f'Setting up dataset cache for {base_path}')
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
                        info = DatasetInfoFull.model_validate(toml.loads(f.read()))

                    # verify files exist
                    if not (entry / info.db_filename).exists():
                        logger.warning(f'Dataset in {entry.name} is missing db_filename; ignoring dataset!')
                        continue
                    if not (entry / info.arrow_filename).exists():
                        logger.warning(f'Dataset in {entry.name} is missing arrow_file; ignoring dataset!')
                        continue
                    if not info.keywords_filename or not (entry / info.keywords_filename).exists():
                        logger.warning(f'Dataset in {entry.name} is missing keywords_file!')

                    # Append to list of known datasets
                    dataset = Dataset(info=info, key=entry.name, path=entry.absolute())
                    self.datasets[dataset.key] = dataset

                    # Log this (indirectly also fetches the dataset size from the database)
                    logger.info(f'Loaded {entry.name} with {dataset.total:,} documents.')

                except ValidationError as e:
                    logger.warning(f'Failed to validate dataset info at {entry.name}')
                    logger.exception(e)
            else:
                logger.info(f'Ignoring data in {entry.name}')


datasets = DatasetCache(base_path=Path(settings.DATASETS_FOLDER))
datasets.reload()

__all__ = ['datasets', 'Dataset', 'DatasetInfo']
