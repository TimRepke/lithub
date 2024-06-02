from pathlib import Path

import numpy as np
import pandas as pd

from converter.project import get_vectors
from converter.write import write
from converter.cdrmap.info import labels

BASE = Path('.data/cdrmap')

CHUNK_SIZE = 10000
INFO = Path(BASE / 'info.toml')
VECTORS = Path(BASE / 'raw/vectors.npy')
OUT_SLIM = Path(BASE / 'slim.arrow')
OUT_FULL = Path(BASE / 'raw/full.arrow')
OUT_SQL = Path(BASE / 'documents.sqlite')

print('Reading original data...')
df = pd.read_csv(BASE / 'raw/literature_hub_cdrmap_3.csv', lineterminator='\n')
df = df.replace({np.nan: None})
print(df.shape)

print('Getting vectors...')
embedding, mins, maxs, spans = get_vectors(
    cache=VECTORS,
    df=df,
    to_txt=lambda r: (r['abstract'] or '') + (r['title'] or '')
)
print(embedding.shape)

print('Loading info...')
scheme_keys = list(labels.keys())
print(scheme_keys)

print('Transforming rows...')
rows = []
for idx, ((_, row), vector) in enumerate(zip(df.iterrows(), embedding)):
    annotations = {key: None for key in scheme_keys}

    for key in scheme_keys:
        annotations[key] = row.get(key)

    rows.append({
        'idx': idx,
        'x': (((vector[0] - mins[0]) / spans[0]) * 2) - 1,
        'y': (((vector[1] - mins[1]) / spans[1]) * 2) - 1,
        'publication_year': row['publication_year'],
        'openalex_id': row['openalex_id'],
        'title': row['title'],
        'abstract': row['abstract'],
        'doi': row['doi'],
        'authors': row['authors'],
        'institutions': row['institutions'],
        **annotations
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
    out_slim=BASE / 'slim.arrow',
    out_sql=BASE / 'documents.sqlite',
    extra_scheme={}
)

df.to_feather(BASE / 'raw/full.arrow')
