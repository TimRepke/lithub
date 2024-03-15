import json
from collections import defaultdict

from fastapi import APIRouter
import logging


logger = logging.getLogger('api.data')
router = APIRouter()

Scheme = dict[int, tuple[str, list[str]]]


def get_scheme(dataset: str, secret: str | None = None) -> Scheme:
    with Database(dataset, secret) as db:
        res = db.cur.execute('SELECT * FROM scheme')
        return {
            r['scheme_id']: (r['label'], json.loads(r['choices']))
            for r in res
        }


def resolve_annotations(s: str, scheme: Scheme) -> DocumentAnnotation:
    parsed = [tuple(int(ci) for ci in c.split(':')[:2]) for c in s.split('|')]
    ret = defaultdict(list)
    for lab, choice in parsed:
        ret[scheme[lab][0]].append(scheme[lab][1][choice])
    return dict(ret)


def resolve_json(s: str | None):
    if s is not None and len(s) > 0:
        return json.loads(s)
    return None


@router.get('/scheme', response_model=list[SchemeInfo])
async def get_scheme_with_numbers(dataset: str, secret: str | None = None):
    def prepare_scheme_info(r):
        counts = dict((int(ci) for ci in c.split(':')[:2]) for c in r['counts'].split('|'))
        choices = json.loads(r['choices'])
        parsed_choices = {choices[k]: v for k, v in counts.items()}

        return SchemeInfo(scheme_id=r['scheme_id'], label=r['label'], description=r['description'],
                          choices=parsed_choices,
                          i2s=choices,
                          s2i={v: k for k, v in enumerate(choices)})

    with Database(dataset, secret) as db:
        q = db.resolve("SELECT scheme_id, s.label, choices, description, "
                       "       group_concat(choice || ':' || cnt, '|') as counts "
                       "FROM scheme s "
                       "         LEFT JOIN (SELECT label, choice, count(choice) as cnt "
                       "                    FROM labels "
                       "                    GROUP BY choice) l on s.scheme_id = l.label "
                       "GROUP BY scheme_id, s.label, choices, description;")
        res = db.cur.execute(q)

        return [prepare_scheme_info(r_) for r_ in res]


@router.get('/sample/{label}/{choice}',
            response_model=list[Document],
            response_model_exclude={'x', 'y', 'RowNum'})
async def get_label_sample(dataset: str, label: int, choice: int, limit: int = 50, secret: str | None = None):
    with Database(dataset, secret) as db:
        q = db.resolve('SELECT d.* '
                       'FROM $data_tab d '
                       '         JOIN '
                       '     (SELECT doc_id '
                       # get all matching labels and assign consecutive row numbers
                       '      FROM (SELECT ROW_NUMBER() OVER (ORDER BY label_id ) RowNum, doc_id '
                       '            FROM labels '
                       '            WHERE label = :label '
                       '              AND choice = :choice) '
                       # only return every n-th row (RowNum `mod` stepsize) == 0
                       '      WHERE RowNum % floor(('
                       # number of documents with this label/choice
                       '            SELECT count(1) FROM labels WHERE label = :label AND choice = :choice'
                       '          ) / :limit) = 0) l on d.doc_id = l.doc_id')
        res = db.cur.execute(q, {'label': label, 'choice': choice, 'limit': limit})

        if db.dataset.info.type == 'documents':
            return [Document(**r) for r in res]
        else:
            raise UnknownDatatypeError(f'{db.dataset.info.type} not implemented!')


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
