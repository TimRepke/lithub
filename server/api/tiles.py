from pathlib import Path

from fastapi import APIRouter
from fastapi.staticfiles import StaticFiles
import logging

from ..utils.config import settings
from ..utils.datasets import dataset_cache

logger = logging.getLogger('api.tiles')
router = APIRouter()

logger.debug(f'Found {len(dataset_cache.datasets)} datasets')

for dataset in dataset_cache.datasets.keys():
    directory = Path(settings.DATASETS_FOLDER) / dataset / 'tiles'
    logger.debug(directory)
    if not directory.exists() or not directory.is_dir():
        logger.warning(f'No tiles available for {dataset} at {directory} (ignoring)')
        continue
    logger.debug(f'Hooking tiles provider for {dataset} to {directory}')

    router.mount(f'/{dataset}/', StaticFiles(directory=directory, html=False), name='static')
