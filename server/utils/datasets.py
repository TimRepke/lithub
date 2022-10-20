import json

import toml
from pathlib import Path
from typing import Literal
from pydantic import BaseModel

from ..utils.config import settings


class MissingOrWrongSecretError(Exception):
    pass


class DatasetInfo(BaseModel):
    name: str
    description: str
    # type of data
    type: Literal['documents']


class DatasetDatabase(BaseModel):
    # the table the data is stored in (e.g. documents)
    data: str
    # name of the database file
    db_filename: str = 'data.sqlite'


class Dataset(BaseModel):
    info: DatasetInfo
    db: DatasetDatabase

    # folder name
    key: str
    # secret token (optional, if set, user has to provide the secret to see the data)
    secret: str | None = None
    # Whether tiles have already been created
    has_tiles: bool

    def assert_secret(self, secret: str):
        if self.secret is not None and secret != self.secret:
            raise MissingOrWrongSecretError()


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
                with open(entry / 'info.toml', 'r') as f:
                    # Read meta-data from info file
                    info = toml.loads(f.read())

                    # Add internal meta-data
                    info['key'] = entry.name
                    info['has_tiles'] = (entry / 'tiles').exists()

                    # Append to list of known datasets
                    dataset = Dataset.parse_obj(info)
                    self.datasets[dataset.key] = dataset


dataset_cache = DatasetCache(base_path=Path(settings.DATASETS_FOLDER))
dataset_cache.reload()

__all__ = ['dataset_cache', 'Dataset']
