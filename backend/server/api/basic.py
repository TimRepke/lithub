from fastapi import APIRouter, Query
import logging

from starlette.responses import PlainTextResponse

from ..datasets import DatasetInfoWeb, datasets as dataset_cache
from ..util import as_bitmask
from ..cache import cache
from ..cache.coders import BytesCoder, JsonCoder

logger = logging.getLogger('api.basic')
router = APIRouter()
datasets = dataset_cache.datasets


@router.get('/info/', response_model=list[DatasetInfoWeb])
async def get_datasets() -> list[DatasetInfoWeb]:
    return [ds.info for ds in datasets.values()]


@router.get('/info/{dataset}', response_model=DatasetInfoWeb)
async def get_dataset(dataset: str) -> list[DatasetInfoWeb]:
    return datasets[dataset].info


@router.get('/bitmask/{dataset}', response_class=PlainTextResponse)
@cache(coder=BytesCoder)
async def get_bitmask(dataset: str, key: str, min_score: float = 0.5) -> bytes:
    with datasets[dataset] as db:
        rslt = db.cur.execute(f'SELECT idx FROM documents WHERE {db.safe_col(key)} >= :min_score ORDER BY idx;',
                              {'min_score': min_score})
        mask = as_bitmask((r['idx'] for r in rslt), datasets[dataset].total)
        return mask


@router.get('/bitmask/{dataset}/ids')
@cache(coder=JsonCoder)
async def get_ids(dataset: str, key: str, min_score: float = 0.5) -> list[int]:
    with datasets[dataset] as db:
        rslt = db.cur.execute(f'SELECT idx FROM documents WHERE {db.safe_col(key)} >= :min_score ORDER BY idx;',
                              {'min_score': min_score})
        return [r['idx'] for r in rslt]


@router.get('/search/bitmask/{dataset}', response_class=PlainTextResponse)
async def get_search_mask(dataset: str, query: str, fields: list[str] = Query()) -> bytes:
    with datasets[dataset] as db:
        field_filters = [
            f"{db.safe_col(field)} MATCH :query"
            for field in fields
        ]
        rslt = db.cur.execute(f'SELECT idx FROM search '
                              f'WHERE {" OR ".join(field_filters)} '
                              f'ORDER BY idx;',
                              {'query': query})
        mask = as_bitmask((r['idx'] for r in rslt), datasets[dataset].total)
        return mask
