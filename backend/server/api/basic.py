import csv
import io
import logging
from sqlite3 import Cursor
from typing import Generator, Annotated, Literal

from fastapi import APIRouter, Query, HTTPException, Body, Depends, status as http_status, BackgroundTasks
from fastapi.responses import StreamingResponse, PlainTextResponse
from pydantic import BaseModel

from ..config import settings
from ..datasets import DatasetInfoWeb, datasets as dataset_cache, Dataset
from ..mails import send_message, EmailNotSentError, mailing_active
from ..types import AnnotatedDocument
from ..util import as_bitmask, as_ids
from ..cache import cache
from ..cache.coders import BytesCoder, JsonCoder

logger = logging.getLogger('api.basic')
router = APIRouter()
datasets = dataset_cache.datasets


def ensure_dataset(dataset: str = Query()) -> Dataset:
    if dataset in datasets:
        return datasets[dataset]
    raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND)


@router.get('/infos', response_model=list[DatasetInfoWeb])
async def get_datasets() -> list[DatasetInfoWeb]:
    return [ds.info for ds in datasets.values()]


@router.get('/info', response_model=DatasetInfoWeb)
async def get_dataset(dataset: Annotated[DatasetInfoWeb, Depends(ensure_dataset)]) -> DatasetInfoWeb:
    return dataset.info


@router.get('/bitmask', response_class=PlainTextResponse)
@cache(coder=BytesCoder)
async def get_bitmask(dataset: Annotated[Dataset, Depends(ensure_dataset)],
                      key: str, min_score: float = 0.5) -> bytes:
    with dataset as db:
        rslt = db.cur.execute(f'SELECT idx FROM documents WHERE {db.safe_col(key)} >= :min_score ORDER BY idx;',
                              {'min_score': min_score})
        mask = as_bitmask((r['idx'] for r in rslt), dataset.total)
        return mask


@router.get('/bitmask/ids')
@cache(coder=JsonCoder)
async def get_ids(dataset: Annotated[Dataset, Depends(ensure_dataset)],
                  key: str, min_score: float = 0.5) -> list[int]:
    with dataset as db:
        rslt = db.cur.execute(f'SELECT idx FROM documents WHERE {db.safe_col(key)} >= :min_score ORDER BY idx;',
                              {'min_score': min_score})
        return [r['idx'] for r in rslt]


@router.get('/search/bitmask', response_class=PlainTextResponse)
async def get_search_mask(dataset: Annotated[Dataset, Depends(ensure_dataset)],
                          query: str, fields: list[str] = Query()) -> bytes:
    with dataset as db:
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


@router.post('/documents', response_model=list[AnnotatedDocument])
async def get_documents(dataset: Annotated[Dataset, Depends(ensure_dataset)],
                        bitmask: str | None = Body(default=None),
                        ids: list[int] | None = Body(default=None),
                        order_by: list[str] | None = Body(default=None),
                        limit: int = 10,
                        page: int = 0) -> list[AnnotatedDocument]:
    if limit > 100:
        raise HTTPException(400, detail='Maximum number of documents exceeded')

    with dataset as db:
        order_fields = ''  # TODO: Do we want default ordering on something?
        where = ''
        if order_by is not None and len(order_by) > 0:
            # order_fields = f'ORDER BY {", ".join([db.safe_col(field) for field in order_by])} DESC'
            order_fields = f'ORDER BY ({" + ".join([db.safe_col(field) for field in order_by])}) DESC'
        if bitmask is not None and len(bitmask) > 0:
            ids = as_ids(bitmask)
        if ids is not None and len(ids) > 0:
            # casting to int first, so any SQL injection attempt would blow up
            ids_str = ','.join([str(int(i)) for i in ids])
            where = f'WHERE idx IN ({ids_str})'
        stmt = f'SELECT * FROM documents {where} {order_fields} LIMIT :limit OFFSET :offset;'
        # logger.debug(stmt)
        rslt = db.cur.execute(stmt, {'limit': limit, 'offset': page * limit})
        return list(convert_documents(rslt, dataset))


class CFR(StreamingResponse):  # custom file response to set the media type
    media_type = 'application/csv'


@router.post('/download', response_class=CFR)
async def get_download(dataset: Annotated[Dataset, Depends(ensure_dataset)],
                       bitmask: str | None = Body(default=None),
                       anyway: str | None = Body(default=None)) -> StreamingResponse:
    where = ''
    if bitmask is not None and len(bitmask) > 0:
        ids = as_ids(bitmask)
        ids_str = ','.join([str(int(i)) for i in ids])
        where = f'WHERE idx IN ({ids_str})'
    stmt = f'SELECT * FROM documents {where} ORDER BY idx;'

    cols = list(dataset.document_columns) + list(dataset.label_columns)

    def streamer():
        with dataset as db:
            rslt = db.cur.execute(stmt)
            stream = io.StringIO()
            writer = csv.DictWriter(stream, fieldnames=cols, lineterminator='\n')
            writer.writeheader()
            yield stream.getvalue()

            n_buffered = 0
            pos = stream.tell()
            for row in rslt:
                n_buffered += 1
                writer.writerow({k: row[k] for k in cols})

                if n_buffered > settings.DOWNLOAD_BUFFER:
                    stream.seek(pos)
                    yield stream.read()
                    pos = stream.tell()

            stream.seek(pos)
            yield stream.read()

    response = StreamingResponse(streamer(), media_type='text/csv')
    response.headers['Content-Disposition'] = f'attachment; filename={dataset.key}.csv'

    return response


class FeedbackValue(BaseModel):
    key: str
    selected: bool


class Feedback(BaseModel):
    key: str
    is_wrong: bool
    values: list[FeedbackValue]


@router.post('/report')
async def report(dataset: Annotated[Dataset, Depends(ensure_dataset)],
                 background_tasks: BackgroundTasks,
                 kind: Literal['MISSING', 'ERROR'] = Query(),
                 document: int | None = Query(default=None),
                 name: str = Body(),
                 email: str = Body(),
                 comment: str = Body(),
                 relevant: bool = Body(),
                 feedback: list[Feedback] = Body()) -> None:
    if mailing_active(dataset) and dataset.full_info.contact and len(dataset.full_info.contact) > 0:
        try:
            message = f"""
Hi,

Someone flagged up the following issue on the literature hub:

Project: {dataset.info.name}
Reported issue: {kind}
Sender: {name} <{email}>
Document: {document or '[not provided]'}
Relevant: {relevant}
Comment:
{comment}

"""
            for fb in feedback:
                message += f'{fb.model_dump_json()}\n'

            logger.debug(message)

            recipients = dataset.full_info.contact
            if email:
                recipients.append(email)

            background_tasks.add_task(
                send_message,
                sender=None,
                to=None,
                cc=None,
                bcc=recipients,
                subject=f'[LitHub] New report for "{dataset.info.name}"',
                message=message,
                quiet=True)
        except EmailNotSentError:
            pass


def convert_documents(rslt: Cursor, dataset: Dataset) -> Generator[AnnotatedDocument, None, None]:
    for row in rslt:
        base = {key: row[key] for key in dataset.document_columns}
        labels = {key: row[key] for key in dataset.label_columns}
        yield AnnotatedDocument(**base, labels=labels)


def convert_dicts(rslt: Cursor, dataset: Dataset) -> Generator[dict[str, str | int | float], None, None]:
    for row in rslt:
        base = {key: row[key] for key in dataset.document_columns}
        labels = {key: row[key] for key in dataset.label_columns}
        yield {**base, **labels}
