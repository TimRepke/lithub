import toml
from pathlib import Path

import numpy as np
import pandas as pd

from backend.server.types import DatasetInfoFull
from converter.project import get_vectors
from converter.write import write

print('Reading original data...')
df = pd.read_csv('../../.data/cdrmap/raw/literature_hub_cdrmap_full.csv', lineterminator='\n')
df = df.replace({np.nan: None})

CHUNK_SIZE = 10000
INFO = Path('../../.data/cdrmap/info.toml')
VECTORS = Path('../../.data/cdrmap/raw/vectors.npy')
OUT_SLIM = Path('../../.data/cdrmap/slim.arrow')
OUT_FULL = Path('../../.data/cdrmap/raw/full.arrow')
OUT_SQL = Path('../../.data/cdrmap/documents.sqlite')

print('Loading info...')
info = DatasetInfoFull.model_validate(toml.load(INFO))
scheme_keys = [f'{key}|{int(value.value)}'
               for key, label in info.scheme.items()
               for value in label.values]
print(scheme_keys)

print('Getting vectors...')
embedding, mins, maxs, spans = get_vectors(
    cache=VECTORS,
    df=df,
    to_txt=lambda r: (r['abstract'] or '') + (r['title'] or '')
)

print('Transforming rows...')
out_slim = []
out_full = []
for idx, ((_, row), vector) in enumerate(zip(df.iterrows(), embedding)):
    out = {
        'idx': idx,
        'x': (((vector[0] - mins[0]) / spans[0]) * 2) - 1,
        'y': (((vector[1] - mins[1]) / spans[1]) * 2) - 1,
        'publication_year': row['publication_year'],
    }
    out_slim.append(out)

    blank = {key: None for key in scheme_keys}

    for key in scheme_keys:
        out[key] = row.get(key)

    out_full.append({
        **blank,
        **out,
        'openalex_id': row['openalex_id'],
        'title': row['title'],
        'abstract': row['abstract'],
        'doi': row['doi'],
        'authors': row['authors'],
        'institutions': row['institutions']
        # 'region': row['region_first_author']
        # country_first_author
        # region_first_author
        # continent_first_author
    })

print('Preparing dataframes...')
df_full = pd.DataFrame(out_full)
df_slim = pd.DataFrame(out_slim)

print(df_slim.columns)
print(df_full.columns)

print('Saving to files...')
write(df_full=df_full, df_slim=df_slim, scheme_keys=scheme_keys, out_full=OUT_FULL, out_slim=OUT_SLIM, out_sql=OUT_SQL)
