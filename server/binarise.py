import json
import sqlite3
import logging
from typing import NamedTuple
from pathlib import Path

import numpy as np
import pyarrow as pa
from pyarrow import fs
import pyarrow.compute as pc
from tap import Tap

logging.basicConfig(format='%(asctime)s [%(levelname)s] %(name)s: %(message)s', level=logging.DEBUG)
logger = logging.getLogger('prepper')


class Settings(Tap):
    database: Path
    target_feather: Path
    db_batch_size: int = 250000
    batch_size: int = 10000
    jitter: float = .0


class Extent(NamedTuple):
    # min and max value for each axis
    x: tuple[float, float]
    y: tuple[float, float]


def load_from_sqlite(db_file: Path, jitter: float, batch_size: int) -> (pa.Table, Extent):
    con = sqlite3.connect(db_file)
    con.row_factory = sqlite3.Row
    con.set_trace_callback(logger.debug)
    cur = con.cursor()

    res = cur.execute('SELECT * FROM scheme')
    scheme = {
        r['scheme_id']: (r['label'], json.loads(r['choices']))
        for r in res
    }

    data_raw = {
        'dbid': [],
        'title': [],
        'year': [],
        'x': [],
        'y': []
    }
    for label_id in scheme.keys():
        data_raw[f'label_{label_id}'] = []
    batch_i = 0
    while True:
        res = cur.execute("SELECT d.doc_id as dbid, d.title, d.year, d.x, d.y, "
                          "       group_concat(l.label || ':' || l.choice, '|') annotations "
                          "FROM documents d "
                          "LEFT JOIN labels l on d.doc_id = l.doc_id "
                          "GROUP BY d.doc_id, d.title, d.year, d.x, d.y "
                          "LIMIT :limit OFFSET :offset;",
                          {'limit': batch_size, 'offset': batch_i * batch_size})
        res = res.fetchall()

        logger.debug(f'  > batch {batch_i} with {len(res):,} rows ...')

        # Pivot data from row format to column format
        for field in ['dbid', 'title', 'year', 'x', 'y']:
            data_raw[field] += [row[field] for row in res]

        parsed = [dict([c.split(':')[:2] for c in row['annotations'].split('|')]) for row in res]
        for label_id in scheme.keys():
            data_raw[f'label_{label_id}'] += [int(row.get(str(label_id), -1)) for row in parsed]

        if len(res) < batch_size:
            break

        batch_i += 1

    res = cur.execute('SELECT scheme_id, label, choices, description '
                      'FROM scheme;')
    schemes = res.fetchall()
    logger.debug(f' > Found {len(schemes)} annotation schemes')

    data = {
        'dbid': pa.array(data_raw['dbid'], type=pa.uint32()),
        'title': pa.array(data_raw['title'], type=pa.string()),
        'year': pa.array(data_raw['year'], type=pa.uint16()),
        'x': pa.array(data_raw['x'], type=pa.float32()),
        'y': pa.array(data_raw['y'], type=pa.float32())
    }
    for label_id in scheme.keys():
        data[f'label_{label_id}'] = pa.array(data_raw[f'label_{label_id}'], type=pa.int8())

    if jitter > 0:
        logger.debug(' -> Applying circular jitter to avoid overlapping points...')
        n_rows = data['x'].shape[0]
        rho = np.random.normal(0, jitter, n_rows)
        theta = np.random.uniform(0, 2 * np.pi, n_rows)
        data['x'] = pc.add(data['x'], pc.multiply(rho, pc.cos(theta)))
        data['y'] = pc.add(data['y'], pc.multiply(rho, pc.sin(theta)))

    logger.debug(' -> truncate the title after 101 characters')
    data['title'] = pc.utf8_replace_slice(data['title'], start=101, stop=1000, replacement='')

    logger.debug(' -> Computing extent...')
    extent = Extent(
        x=(pc.min(data['x']).as_py(), pc.max(data['x']).as_py()),
        y=(pc.min(data['y']).as_py(), pc.max(data['y']).as_py())
    )

    meta_data = {
        'extent': json.dumps({'x': extent.x, 'y': extent.y}),
        'total_points': str(len(data_raw['x'])),
        'schemes': json.dumps({
            row['scheme_id']: {
                'scheme_id': row['scheme_id'],
                'column': f"label_{row['scheme_id']}",
                'label': row['label'],
                'choices': json.loads(row['choices']),
                'description': row['description']
            }
            for row in schemes
        })
    }

    table = pa.table(list(data.values()),
                     names=list(data.keys()),
                     metadata=meta_data)

    # filter out non-numeric dates (e.g. null, '1850-1853')
    # mask = pc.invert(pc.is_null(table.column('date')))
    # table = table.filter(mask)

    # sorting by the date improves the loading aesthetics
    # comment this out to exactly match the original appearance
    # indices = pc.sort_indices(table, sort_keys=[('year', 'ascending')])
    # table = pc.take(table, indices)

    # after sorting replace ix with an accurate row index
    # indices = pc.sort_indices(table, sort_keys=[('year', 'ascending')])
    # table = table.set_column(table.schema.get_field_index('ix'), 'ix', pc.cast(indices, pa.uint32()))

    return table, extent


def write_batched_feather(target: Path, table: pa.Table, batch_size: int):
    logger.debug(f'Writing with batch size {batch_size} to {target}')
    local = fs.LocalFileSystem()

    with local.open_output_stream(str(target)) as file:
        with pa.RecordBatchStreamWriter(file, table.schema) as writer:
            writer.write_table(table, batch_size)


if __name__ == '__main__':
    settings = Settings().parse_args()
    logger.info(f'Loading dataset from SQLite file "{settings.database}"')
    arrow_tab, extent = load_from_sqlite(db_file=settings.database, jitter=settings.jitter,
                                    batch_size=settings.db_batch_size)
    logger.info(f'Extent: {extent}')
    write_batched_feather(target=settings.target_feather, table=arrow_tab,batch_size=settings.batch_size)

# with open(source_path) as source:
#     with open(temp_path, 'w') as target:
#         for source_line in source:
#             if source_line.count('\t') != 8:
#                 # filter out records with anomalous columns
#                 # matches the hack in streaming-tsv-parser.js:27
#                 continue
#             target.write(source_line)
#
# table = pa.csv.read_csv(
#     temp_path,
#     parse_options=pa.csv.ParseOptions(
#         delimiter='\t',
#     ),
#     convert_options=pa.csv.ConvertOptions(
#         column_types={
#             'date': pa.uint32(),
#             'x': pa.float32(),
#             'y': pa.float32(),
#             'ix': pa.uint32(),
#             'language': pa.dictionary(pa.int32(), pa.utf8())
#         },
#         null_values=['None', '']
#     ),
# )

# temp_path.unlink()
#
# local = pa.fs.LocalFileSystem()
#
# with local.open_output_stream(str(target_path)) as file:
#     with pa.RecordBatchStreamWriter(file, table.schema) as writer:
#         writer.write_table(table, 10000)
