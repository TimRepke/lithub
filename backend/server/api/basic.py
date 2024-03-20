from sqlite3 import Cursor
from typing import Generator

from fastapi import APIRouter, Query, HTTPException, Body
import logging

from starlette.responses import PlainTextResponse

from ..datasets import DatasetInfoWeb, datasets as dataset_cache, Dataset
from ..types import AnnotatedDocument, Document
from ..util import as_bitmask, as_ids
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


@router.post('/documents/{dataset}', response_model=list[AnnotatedDocument])
async def get_documents(dataset: str,
                        bitmask: str | None = Body(default=None),
                        ids: list[int] | None = Body(default=None),
                        order_by: list[str] | None = Body(default=None),
                        limit: int = 10,
                        page: int = 0) -> list[AnnotatedDocument]:
    if limit > 100:
        raise HTTPException(400, detail='Maximum number of documents exceeded')

    with datasets[dataset] as db:
        order_fields = ''  # TODO: Do we want default ordering on something?
        where = ''
        if order_by is not None and len(order_by) > 0:
            # order_fields = f'ORDER BY {", ".join([db.safe_col(field) for field in order_by])} DESC'
            order_fields = f'ORDER BY ({" + ".join([db.safe_col(field) for field in order_by])}) DESC'
        if bitmask is not None and len(bitmask) > 0:
            ids = as_ids(bitmask)
        if ids is not None and len(ids) > 0:
            # casting to int first, so any SQL injection attempt would blow up
            ids_str = ",".join([str(int(i)) for i in ids])
            where = f'WHERE idx IN ({ids_str})'
        stmt = f'SELECT * FROM documents {where} {order_fields} LIMIT :limit OFFSET :offset;'
        # logger.debug(stmt)
        rslt = db.cur.execute(stmt, {'limit': limit, 'offset': page * limit})
        return list(convert_documents(rslt, datasets[dataset]))


def convert_documents(rslt: Cursor, dataset: Dataset) -> Generator[AnnotatedDocument, None, None]:
    for row in rslt:
        base = {key: row[key] for key in dataset.document_columns}
        labels = {key: row[key] for key in dataset.label_columns}
        yield AnnotatedDocument(**base, labels=labels)
