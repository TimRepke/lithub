from pathlib import Path

from fastapi import APIRouter, Query
from fastapi.staticfiles import StaticFiles
import logging

from ..utils.sqlite import Database
from ..utils.types import Document, UnknownDatatypeError, SchemeInfo, AnnotatedDocument, DocumentAnnotation
from ..utils.config import settings
from ..utils.datasets import dataset_cache

logger = logging.getLogger('api.points')
router = APIRouter()

logger.debug(f'Found {len(dataset_cache.datasets)} datasets')


@router.get('/scatter/{dataset}', response_model=AnnotatedDocument)
async def get_points(dataset: str = Query(),
                     min_x: float = Query(),
                     max_x: float = Query(),
                     min_y: float = Query(),
                     max_y: float = Query(),
                     limit: int = Query(),
                     secret: str | None = Query(default=None)):
    range_x = abs(min_x) + abs(max_x)
    range_y = abs(min_y) + abs(max_y)
    step_x = range_x / settings.SUB_SECTORS
    step_y = range_y / settings.SUB_SECTORS

    sub_sectors = [
        (min_x + (xi * step_x), min_y + (yi * step_y))
        for xi in range(settings.SUB_SECTORS)
        for yi in range(settings.SUB_SECTORS)
    ]

    with Database(dataset, secret) as db:
        q = db.resolve("SELECT d.doc_id, d.x, d.y"
                       "FROM $data_tab d "
                       "WHERE :min_x <= d.x AND d.x <= :max_x AND :min_y <= d.y AND d.y <= :max_y"
                       "LIMIT :limit")
        res = db.cur.execute(q, {'min_x': min_x, 'max_x': max_x, 'min_y': min_y, 'max_y': max_y, 'limit': limit})
        r = res.fetchall()



#
#
# for dataset in dataset_cache.datasets.keys():
#     directory = Path(settings.DATASETS_FOLDER) / dataset / 'tiles'
#     logger.debug(directory)
#     if not directory.exists() or not directory.is_dir():
#         logger.warning(f'No tiles available for {dataset} at {directory} (ignoring)')
#         continue
#     logger.debug(f'Hooking tiles provider for {dataset} to {directory}')
#
#     router.mount(f'/{dataset}/', StaticFiles(directory=directory, html=False), name='static')
