import ast
import toml
from pathlib import Path

import numpy as np
import pandas as pd

from backend.server.types import DatasetInfoFull
from converter.project import get_vectors
from converter.write import write

FULL = True

BASE = Path('../../.data/carbonpricing')
print('Reading original data...')

if FULL:
    df = pd.read_csv(BASE / 'raw/table_seen.csv')
    df = df[df['cp'] == 1]
else:
    df = pd.read_csv(BASE / 'raw/table_incl.csv')
df = df.replace({np.nan: None})

CHUNK_SIZE = 10000
INFO = Path(BASE / 'info.toml')
VECTORS = Path(BASE / 'raw/vectors.npy')
OUT_SLIM = Path(BASE / 'layout.arrow')
OUT_FULL = Path(BASE / 'raw/full.arrow')
OUT_SQL = Path(BASE / 'data.sqlite')

print('Loading info...')
info = DatasetInfoFull.model_validate(toml.load(INFO))
scheme_keys = list(info.labels.keys())
print(scheme_keys)

print('Getting vectors...')
embedding, mins, maxs, spans = get_vectors(
    cache=VECTORS,
    df=df,
    to_txt=lambda r: (r['text'] or '') + (r['title'] or ''),
    dof=0.9, max_df=0.85  # , metric='euclidean'
)

print('Transforming rows...')
rows = []
for idx, ((_, row), vector) in enumerate(zip(df.iterrows(), embedding)):
    rows.append({
        'idx': idx,
        'publication_year': row['publication_year'],
        'title': row['title'],
        'abstract': row['text'],
        'doi': row['doi'],
        'scopus_id': row['scopus_id'],
        'wos_id': row['wos_id'],
        'pubmed_id': row['pubmed_id'],
        'openalex_id': row['openalex_id'],
        'authors': '; '.join(set([
            a['name']
            for a in ast.literal_eval(row['authors'])
        ])) if row['authors'] is not None else '',
        'institutions': '; '.join(set([
            aff['name']
            for a in ast.literal_eval(row['authors'])
            for aff in (a['affiliations'] or [])
        ])) if row['authors'] is not None else '',
        'x': (((vector[0] - mins[0]) / spans[0]) * 2) - 1,
        'y': (((vector[1] - mins[1]) / spans[1]) * 2) - 1,
        **{
            key: row[key]
            for key in info.labels.keys()
        }
    })

print('Form new dataframe...')
df = pd.DataFrame(rows)
print(len(df.columns))
print(df.columns)

print('Saving to files...')
write(
    df_full=df,
    df_slim=df[['idx', 'x', 'y', 'publication_year']],
    scheme_keys=scheme_keys,
    out_slim=OUT_SLIM,
    out_sql=OUT_SQL,
    extra_scheme={}
)

df.to_feather(OUT_FULL)
