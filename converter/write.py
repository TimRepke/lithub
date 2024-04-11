import math
from pathlib import Path

import pandas as pd
import pyarrow as pa
from sqlalchemy import create_engine, text

CHUNK_SIZE = 10000


def write(scheme_keys: list[str], df_slim: pd.DataFrame, df_full: pd.DataFrame,
          out_sql: Path, out_slim: Path, out_full: Path):
    df_slim[scheme_keys + ['x', 'y']] = df_slim[scheme_keys + ['x', 'y']].astype("float16")
    df_full[scheme_keys + ['x', 'y']] = df_full[scheme_keys + ['x', 'y']].astype("float16")
    df_slim[['publication_year', 'idx']] = df_slim[['publication_year', 'idx']].astype("Int64")
    df_full[['publication_year', 'idx']] = df_full[['publication_year', 'idx']].astype("Int64")

    print('Creating sqlite db...')
    out_sql.unlink(missing_ok=True)
    engine = create_engine(f'sqlite:///{out_sql}', echo=False)
    df_full.to_sql(name='documents', con=engine)

    print('Indexing data in sqlite...')
    con = engine.connect()
    # -- Set up search on title, text, authors
    con.execute(text('CREATE VIRTUAL TABLE search USING fts5(idx, title, abstract, authors);'))
    # -- Indexing data
    con.execute(text('INSERT INTO search (idx, title, abstract, authors) '
                     'SELECT idx, title, abstract, authors FROM documents;'))
    con.commit()
    con.close()

    schema = pa.schema([
        ('idx', pa.uint32()),
        ('x', pa.float16()),
        ('y', pa.float16()),
        ('publication_year', pa.uint16())
    ])

    print(f'Writing {out_slim}')
    with pa.OSFile(str(out_slim), 'wb') as sink:
        with pa.ipc.new_stream(sink, schema) as writer:
            n_chunks = int(math.ceil(df_slim.shape[0] / CHUNK_SIZE))
            for chunk in range(n_chunks):
                tmp = df_slim[chunk * CHUNK_SIZE:(chunk + 1) * CHUNK_SIZE]
                batch = pa.record_batch(tmp, schema)
                writer.write(batch)
    print(f'Wrote {out_slim}')
