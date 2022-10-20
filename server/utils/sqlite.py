import sqlite3
from pathlib import Path
import logging

from .config import settings
from .datasets import dataset_cache

logger = logging.getLogger('sqlite')


class Database:
    def __init__(self, dataset: str, secret: str):
        # fetch dataset info
        self.dataset = dataset_cache.datasets[dataset]
        # make sure the user is allowed to see that
        self.dataset.assert_secret(secret)
        # assemble path to database file
        self.db_file = Path(settings.DATASETS_FOLDER) / dataset / self.dataset.db.db_filename

    def __enter__(self):
        self.con: sqlite3.Connection = sqlite3.connect(self.db_file)
        self.con.row_factory = sqlite3.Row
        self.con.set_trace_callback(logger.debug)
        self.cur: sqlite3.Cursor = self.con.cursor()

        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.con.close()

    def resolve(self, query: str):
        return query.replace('$data_tab', self.dataset.db.data)
