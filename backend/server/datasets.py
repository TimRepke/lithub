import json
import sqlite3
from pathlib import Path
from pydantic import ValidationError

from .logging import get_logger
from .config import settings
from .types import Document, DatasetInfoFull, DatasetInfoWeb, SchemeGroup

logger = get_logger('util.datasets')


class Dataset:
    def __init__(self, info: DatasetInfoFull, path: Path, key: str):
        self.key = key
        self.full_info = info
        self.db_file = path / info.db_filename
        self.logger = get_logger(f'util.db.{key}')
        self._total: int | None = None

        self._groups: dict[str, SchemeGroup] | None = None
        self._columns: set[str] | None = None
        self._label_columns: set[str] | None = None
        self._document_columns: set[str] | None = None

    @property
    def groups(self) -> dict[str, SchemeGroup]:
        if self._groups is None:
            groups = self.full_info.groups

            def rec(grp: str) -> list[str]:
                group = groups[grp]
                if group.labels is None:
                    return [gi for g in group.subgroups for gi in rec(g)]
                return group.labels

            for subgroup in groups.values():
                subgroup.labels = rec(subgroup.key)
            self._groups = groups
        return self._groups

    @property
    def info(self) -> DatasetInfoWeb:
        return DatasetInfoWeb(
            key=self.key,
            total=self.total,
            columns=self.columns,
            label_columns=self.label_columns,
            document_columns=self.document_columns,
            **{
                **self.full_info.dict(),
                'groups': self.groups,
            }
        )

    @property
    def total(self) -> int:
        if self._total is None:
            try:
                with self as db:
                    logger.debug(f'Loading size of dataset for {self.key}')
                    rslt = db.cur.execute('SELECT COUNT(1) as total FROM documents;').fetchone()
                    self._total = rslt['total']
            except Exception as e:
                logger.error(e)
                logger.warning('Falling back to returning `0` as total count.')
                return 0
        return self._total

    @property
    def columns(self) -> set[str]:
        if self._columns is None:
            with self as db:
                logger.debug(f'Loading columns for {self.key}')
                rslt = db.cur.execute('PRAGMA table_info(documents);').fetchall()
                self._columns = set([r['name'] for r in rslt])
                print(self._columns)
        return self._columns

    @property
    def label_columns(self) -> set[str]:
        if self._label_columns is None:
            cols = list(self.full_info.labels.keys())
            self._label_columns = self.columns.intersection(cols)
        return self._label_columns

    @property
    def document_columns(self) -> set[str]:
        if self._document_columns is None:
            self._document_columns = self.columns.intersection(Document.model_fields.keys())
        return self._document_columns

    def unwrap_column(self, col: str) -> list[str]:
        if col in self.columns:
            return [col]
        group = self.full_info.groups.get(col)
        if group is None:
            return []
        if group.labels is not None:
            return group.labels
        if group.subgroups is not None:
            return [lab for sg in group.subgroups for lab in self.unwrap_column(sg)]
        return []

    def safe_col_silent(self, col: str):
        if col not in self.columns:
            return None
        return f'"{col}"'

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
            logger.info(f'Checking if folder {entry} is a dataset')
            # Only consider folders (excl. those starting with ".") that contain a 'info.json' file
            if entry.is_dir() and not entry.name.startswith('.') and (entry / 'info.json').exists():
                try:
                    with open(entry / 'info.json', 'r') as f:
                        # Read meta-data from info file
                        info = DatasetInfoFull.model_validate(json.loads(f.read()))

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

__all__ = ['datasets', 'Dataset', 'DatasetInfoWeb']
