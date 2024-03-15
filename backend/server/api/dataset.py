import json
from collections import defaultdict

from fastapi import APIRouter
import logging

from ..datasets import datasets

logger = logging.getLogger('api.data')
router = APIRouter()

Scheme = dict[int, tuple[str, list[str]]]





@router.get('/paged/{label}/{choice}',
            response_model=list[Document],
            response_model_exclude={'x', 'y', 'RowNum'})
async def get_label_paged(dataset: str, label: int, choice: int, page: int = 1, limit: int = 50,
                          secret: str | None = None):
    with Database(dataset, secret) as db:
        q = db.resolve('SELECT d.* '
                       'FROM $data_tab d '
                       'JOIN labels l ON d.doc_id = l.doc_id '
                       'WHERE label = :label AND choice = :choice '
                       'LIMIT :limit OFFSET :offset;')
        res = db.cur.execute(q, {'label': label, 'choice': choice, 'limit': limit, 'offset': (page - 1) * limit})

        if db.dataset.info.type == 'documents':
            return [Document(**{**r, 'authors': resolve_json(r['authors'])}) for r in res]
        else:
            raise UnknownDatatypeError(f'{db.dataset.info.type} not implemented!')


@router.get('/abstract/{doc_id}', response_model=str)
async def get_abstract(dataset: str, doc_id: int, secret: str | None = None):
    with Database(dataset, secret) as db:
        q = db.resolve('SELECT abstract FROM $data_tab WHERE doc_id = :doc_id;')
        res = db.cur.execute(q, {'doc_id': doc_id})

        return res.fetchone()['abstract']


@router.get('/info/{doc_id}', response_model=AnnotatedDocument)
async def get_info(dataset: str, doc_id: int, secret: str | None = None):
    scheme = get_scheme(dataset, secret)
    with Database(dataset, secret) as db:
        q = db.resolve("SELECT d.*, "
                       "       group_concat(l.label || ':' || l.choice, '|') annotations "
                       "FROM $data_tab d "
                       "LEFT JOIN labels l on d.doc_id = l.doc_id "
                       "WHERE d.doc_id = :doc_id "
                       "GROUP BY d.doc_id, d.nacsos_id, d.doi, d.title, d.abstract, d.year, d.authors, d.x, d.y ")
        res = db.cur.execute(q, {'doc_id': doc_id})
        r = res.fetchone()
        return AnnotatedDocument(doc_id=r['doc_id'], title=r['title'], year=r['year'], abstract=r['abstract'],
                                 x=r['x'], y=r['y'], doi=r['doi'], nacsos_id=r['nacsos_id'],
                                 authors=resolve_json(r['authors']),
                                 annotations=resolve_annotations(r['annotations'], scheme))


@router.get('/all',
            response_model=list[Document],
            response_model_exclude={'x', 'y', 'RowNum', 'abstract'})
async def get_data_paged(dataset: str, page: int = 1, limit: int = 50, secret: str | None = None):
    scheme = get_scheme(dataset, secret)
    with Database(dataset, secret) as db:
        q = db.resolve("SELECT d.*, "
                       "       group_concat(l.label || ':' || l.choice, '|') annotations "
                       "FROM $data_tab d "
                       "LEFT JOIN labels l on d.doc_id = l.doc_id "
                       # "WHERE l.label = 0 "
                       "GROUP BY d.doc_id, d.nacsos_id, d.doi, d.title, d.abstract, d.year, d.authors, d.x, d.y "
                       "LIMIT :limit OFFSET :offset;")
        res = db.cur.execute(q, {'limit': limit, 'offset': (page - 1) * limit})

        if db.dataset.info.type == 'documents':
            return [AnnotatedDocument(doc_id=r['doc_id'], title=r['title'], year=r['year'], abstract=r['abstract'],
                                      x=r['x'], y=r['y'], doi=r['doi'], nacsos_id=r['nacsos_id'],
                                      authors=resolve_json(r['authors']),
                                      annotations=resolve_annotations(r['annotations'], scheme))
                    for r in res]
        else:
            raise UnknownDatatypeError(f'{db.dataset.info.type} not implemented!')
