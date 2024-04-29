from pathlib import Path

import pandas as pd
import numpy as np

from converter.healthmap.info import topics as TOPICS_
from converter.write import write

BASE = Path('.data/healthmap')

print('Constructing translators...')
TOPICS = {t.name: t.key for t in TOPICS_}
LABELS = {
    'relevance|0': 'rel|1',
    'climate_category|0': 'cat|0',
    'climate_category|1': 'cat|1',
    'climate_category|2': 'cat|2',
    # 'North America': 'cont|0',
    # 'South America': 'cont|1',
    # 'Asia': 'cont|2',
    # 'Oceania': 'cont|3',
    # 'Africa': 'cont|4',
    # 'Europe': 'cont|5',
}
TRANSLATION = {
    **LABELS,
    **TOPICS,
}

topic_cols = [t.key for t in TOPICS_]
cols = ['rel|1',
        'cat|0', 'cat|1', 'cat|2',
        'cont|0', 'cont|1', 'cont|2', 'cont|3', 'cont|4', 'cont|5'] + sorted(topic_cols)

print('Load dataset...')
df_db = pd.read_feather(BASE / 'raw/database_2024-01.feather')
df_exp = pd.read_feather(BASE / 'raw/map_export_fixed.feather')
df_db = df_db.replace({np.nan: None})
df_exp = df_exp.replace({np.nan: None})
df_db.set_index('id', drop=False, inplace=True)
df_exp.set_index('id', drop=False, inplace=True)

print('df_db', len(df_db.columns))
print('df_exp', len(df_exp.columns))

print('Extract info...')
maxs = df_exp[['x', 'y']].max(axis=0)
mins = df_exp[['x', 'y']].min(axis=0)
spans = np.sqrt(np.power(mins - maxs, 2))

print('Translate rows...')
rows = []
i = 0
missing_keys = []
for _, row in df_exp.iterrows():
    try:
        topics: dict[str, float | None] = {c: None for c in topic_cols}

        for top_i, top in enumerate(list(row[TOPICS.keys()]
                                                 .infer_objects(copy=False)
                                                 .replace({np.nan: 0})
                                                 .sort_values()
                                                 .index)[-10:]):
            topics[TOPICS[top]] = max(0, 1.0 - (top_i / 12.0) - 0.25)

        rows.append({
            'idx': i,
            'publication_year': row['publication_year'],
            'title': row['title'],
            'abstract': row['abstract'],
            'doi': row['doi'],
            'openalex_id': row['id'],
            'authors': row['authors'],
            'institutions': row['institutions'],
            'x': (((row['x'] - mins['x']) / spans['x']) * 2) - 1,
            'y': (((row['y'] - mins['y']) / spans['y']) * 2) - 1,
            'rel|1': row['relevance|0'],
            'cat|0': row['climate_category|0'],
            'cat|1': row['climate_category|1'],
            'cat|2': row['climate_category|2'],
            'cont|0': df_db.loc[row['id'], 'North America'],
            'cont|1': df_db.loc[row['id'], 'South America'],
            'cont|2': df_db.loc[row['id'], 'Asia'],
            'cont|3': df_db.loc[row['id'], 'Oceania'],
            'cont|4': df_db.loc[row['id'], 'Africa'],
            'cont|5': df_db.loc[row['id'], 'Europe'],
            **topics
        })
        i += 1
    except KeyError as e:
        missing_keys.append(e)
print(len(missing_keys))

print('Form new dataframe...')
df = pd.DataFrame(rows)
print(len(df.columns))
print(df.columns)

print('Saving to files...')
write(
    df_full=df,
    df_slim=df[['idx', 'x', 'y', 'publication_year']],
    scheme_keys=cols,
    out_slim=BASE / 'slim.arrow',
    out_sql=BASE / 'documents.sqlite',
    extra_scheme={}
)
