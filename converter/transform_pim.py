import math
import random
from pathlib import Path
import json
import pandas as pd
import numpy as np
import openTSNE
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
import pyarrow as pa
from pyarrow import feather
from sqlalchemy import create_engine

df = pd.read_csv('data/climate_policy_papers.csv')
df = df.replace({np.nan: None})

VECTORS = Path('data/policies.vectors.npy')
OUT_SLIM_ext = Path('frontend/public/policies.min.arrow')
OUT_SLIM = Path('data/policies.min.arrow')
OUT_FULL = Path('data/policies.full.arrow')
GEOJSON = Path('data/policies.geojson')

MAP = {
    '4 - 1. Economic instruments': ('Policy instrument', 'ins', 0, 'Economic'),
    '4 - 2. Regulatory Instruments': ('Policy instrument', 'ins', 1, 'Regulatory'),
    '4 - 3. Information, education and training': (
        'Policy instrument', 'ins', 2, 'Information, education and training'),
    '4 - 4. Governance, strategies and targets': ('Policy instrument', 'ins', 3, 'Governance, strategies and targets'),
    '4 - 5. Agreements': ('Policy instrument', 'ins', 4, 'Agreements'),

    '5 - 1.02. Carbon pricing': ('Economic instrument', 'econ', 0, 'Carbon pricing'),
    '5 - 1.02. Subsidies': ('Economic instrument', 'econ', 1, 'Subsidies'),
    '5 - 1.03. Non-carbon taxes': ('Economic instrument', 'econ', 2, 'Non-carbon taxes'),
    '5 - 1.04. Direct Investment / spending': ('Economic instrument', 'econ', 3, 'Direct Investment / spending'),

    '5 - 2.06. Quotas': ('Regulatory instrument', 'reg', 0, 'Quotas'),
    '5 - 2.09. Spatial and land-use planning': ('Regulatory instrument', 'reg', 1, 'Spatial and land-use planning'),
    '5 - 2.11. Standards': ('Regulatory instrument', 'reg', 2, 'Standards'),

    '5 - 3.15. Standardized labels, reporting and accounting standards and certification schemes': (
        'Information, education and training', 'edu', 0,
        'Standardized labels, reporting and accounting standards and certification schemes'
    ),

    '5 - 4.17. Planning': ('Governance', 'gov', 0, 'Planning'),
    '5 - 4.18. Government administration & management': (
        'Governance', 'gov', 1, 'Government administration & management'),
    '5 - 4.19. Institutions': ('Governance', 'gov', 2, 'Institutions'),

    # '5 - 5.20. Inter/transnational agreements': ('Agreements', 'agr', 0, 'Inter/transnational agreements'),
    # '5 - 5.21. Inter/transnational agreements': ('Agreements', 'agr', 0, 'Inter/transnational agreements'),

    '8 - 01. AFOLU': ('Sector', 'sec', 0, 'AFOLU'),
    '8 - 02. Buildings': ('Sector', 'sec', 1, 'Buildings'),
    '8 - 03. Industry': ('Sector', 'sec', 2, 'Industry'),
    '8 - 04. Energy': ('Sector', 'sec', 3, 'Energy'),
    '8 - 05. Transport': ('Sector', 'sec', 4, 'Transport'),
    '8 - 06. Waste': ('Sector', 'sec', 5, 'Waste'),
    '8 - 15. Cross-sectoral': ('Sector', 'sec', 6, 'Cross-sectoral'),

    '10 - 3. Quantitative': ('Method', 'meth', 0, 'Quantitative'),
    '10 - 4. Qualitative': ('Method', 'meth', 1, 'Qualitative'),

    '17 - 0. Supranational and international': ('Implementation level', 'lvl', 0, 'Supranational and international'),
    '17 - 1. National': ('Implementation level', 'lvl', 1, 'National'),
    '17 - 2. Sub-national': ('Implementation level', 'lvl', 2, 'Sub-national'),

    '19 - 0. Ex-post': ('Evidence type', 'ev', 0, 'Ex-post'),
    '19 - 1. Ex-ante': ('Evidence type', 'ev', 1, 'Ex-ante')
}

LABELS = {
    'ins': {'name': 'Policy instrument',
            'type': 'single',
            'values': {0: 'Economic', 1: 'Regulatory', 2: 'Information, education and training',
                       3: 'Governance, strategies and targets', 4: 'Agreements'}},
    'econ': {'name': 'Economic instrument',
             'type': 'single',
             'values': {0: 'Carbon pricing', 1: 'Subsidies', 2: 'Non-carbon taxes',
                        3: 'Direct Investment / spending'}},
    'reg': {'name': 'Regulatory instrument',
            'type': 'single',
            'values': {0: 'Quotas', 1: 'Spatial and land-use planning', 2: 'Standards'}},
    'edu': {'name': 'Information, education and training',
            'type': 'single',
            'values': {0: 'Standardized labels, reporting and accounting standards and certification schemes'}},
    'gov': {'name': 'Governance',
            'type': 'single',
            'values': {0: 'Planning', 1: 'Government administration & management', 2: 'Institutions'}},
    'sec': {'name': 'Sector',
            'type': 'single',
            'values': {0: 'AFOLU', 1: 'Buildings', 2: 'Industry', 3: 'Energy', 4: 'Transport', 5: 'Waste',
                       6: 'Cross-sectoral'}},
    'meth': {'name': 'Method',
             'type': 'single',
             'values': {0: 'Quantitative', 1: 'Qualitative'}},
    'lvl': {'name': 'Implementation level',
            'type': 'single',
            'values': {0: 'Supranational and international', 1: 'National', 2: 'Sub-national'}},
    'ev': {'name': 'Evidence type',
           'type': 'single',
           'values': {0: 'Ex-post', 1: 'Ex-ante'}}}

if VECTORS.exists():
    with open(VECTORS, 'rb') as f:
        embedding = np.load(f)
else:
    vectoriser = TfidfVectorizer(stop_words='english', lowercase=True, min_df=0.01, max_df=0.9, max_features=5000)
    vectors = vectoriser.fit_transform([(r['abstract'] or '') + (r['title'] or '') for _, r in df.iterrows()])
    vectors = vectors.todense()
    vectors = np.asarray(vectors)
    tsne = openTSNE.TSNE(
        perplexity=30,
        metric='euclidean',
        n_jobs=8,
        random_state=42,
        verbose=True,
    )
    embedding = tsne.fit(vectors)
    with open(VECTORS, 'wb') as f:
        np.save(f, embedding)

maxs = embedding.max(axis=0)
mins = embedding.min(axis=0)
spans = np.sqrt(np.power(mins - maxs, 2))

out_slim = []
out_full = []
for idx, ((_, row), vector) in enumerate(zip(df.iterrows(), embedding)):
    blank = {
        f'{key}|{int(value)}': None
        for key, label in LABELS.items()
        for value in label['values'].keys()
    }
    blank['incl'] = None

    out = {
        'idx': idx,
        # 'item_id': row['item_id'],
        'x': (vector[0] - mins[0]) / spans[0],
        'y': (vector[1] - mins[1]) / spans[1],
        'publication_year': row['publication_year'],
        **blank
    }

    for col, (name, k, v, vn) in MAP.items():
        if row[col] > 0.5:
            out[f'{k}|{v}'] = 1
    if row['INCLUDE'] > 0.5:
        out['incl'] = 1

    out_slim.append(out)
    out_full.append({**out,
                     **{
                         'openalex_id': row['id'],
                         'title': row['title'],
                         'text': row['abstract'],
                         'type': row['type'],
                         'doi': row['doi'],
                         'authors': row['author_name'],
                         'institutions': row['institution_name']
                     }})

df_slim = pd.DataFrame(out_slim)
df_full = pd.DataFrame(out_full)
print(dict(df_full.dtypes))

cols = [f'{key}|{int(value)}'
        for key, label in LABELS.items()
        for value in label['values'].keys()]
cols += ['publication_year', 'idx', 'incl']

df_slim[cols] = df_slim[cols].astype("Int64")
df_full[cols] = df_full[cols].astype("Int64")
df_slim[['x', 'y']] = df_slim[['x', 'y']].astype("float16")
df_full[['x', 'y']] = df_full[['x', 'y']].astype("float16")

CHUNK_SIZE = 5000
CHUNK_PATH = Path('data/chunks/')
CHUNK_PATH.mkdir(parents=True, exist_ok=True)

schema = pa.schema([
                       ('idx', pa.uint32()),
                       ('x', pa.float16()),
                       ('y', pa.float16()),
                       ('publication_year', pa.uint16()),
                       ('incl', pa.bool_())
                   ] + [
                       (f'{key}|{int(value)}', pa.bool_())
                       for key, label in LABELS.items()
                       for value in label['values'].keys()
                   ])
schema_full = pa.schema([
                            ('idx', pa.uint32()),
                            ('x', pa.float16()),
                            ('y', pa.float16()),
                            ('publication_year', pa.uint16()),
                            ('incl', pa.bool_())
                        ] + [
                            (f'{key}|{int(value)}', pa.bool_())
                            for key, label in LABELS.items()
                            for value in label['values'].keys()
                        ] + [
                            ('openalex_id', pa.string()),
                            ('title', pa.string()),
                            ('text', pa.string()),
                            ('doi', pa.string()),
                            ('type', pa.string()),
                            ('authors', pa.string()),
                            ('institutions', pa.string())
                        ])


def write_table(target, sub, scm):
    # t = pa.Table.from_pylist(list(sub.to_dict().values()), schema=schema)
    t = pa.Table.from_pandas(df=sub)
    t = t.cast(scm)
    w = pa.ipc.RecordBatchFileWriter(target, schema=scm)
    # options=pa.ipc.IpcWriteOptions(compression='lz4'))
    w.write_table(t, 1000)
    w.close()


def write_table_ipc(target, sub: pd.DataFrame, scm):
    print(f'Writing {target}')
    with pa.OSFile(str(target), 'wb') as sink:
        with pa.ipc.new_stream(sink, scm) as writer:
            n_chunks = int(math.ceil(sub.shape[0] / CHUNK_SIZE))
            for chunk in range(n_chunks):
                tmp = sub[chunk * CHUNK_SIZE:(chunk + 1) * CHUNK_SIZE]
                batch = pa.record_batch(tmp, scm)
                writer.write(batch)
    print(f'Wrote {target}')


print(df_slim.shape)
# for chunk in range(math.ceil(df_slim.shape[0] / CHUNK_SIZE)):
#     write_table(str(CHUNK_PATH / f'chunk-{chunk:04}.arrow'), df_slim[chunk * CHUNK_SIZE:(chunk + 1) * CHUNK_SIZE])

write_table_ipc(OUT_SLIM, df_slim, schema)
write_table_ipc(OUT_SLIM_ext, df_slim, schema)
write_table_ipc(OUT_FULL, df_full, schema_full)

engine = create_engine('sqlite:///data/policies.sqlite', echo=False)
df.to_sql(name='abstracts', con=engine)

raise Exception


# df_slim.to_feather(OUT_SLIM)
# df_full.to_feather(OUT_FULL)
#
#
# df_slim.to_csv(str(OUT_SLIM) + '.csv', index=False)
# df_full.to_csv(str(OUT_FULL) + '.csv', index=False)

# for chunk in range(math.ceil(df_slim.shape[0] / CHUNK_SIZE)):
#     df_slim[chunk * CHUNK_SIZE:(chunk + 1) * CHUNK_SIZE].to_feather(CHUNK_PATH / f'chunk-{chunk:04}.arrow',
#                                                                     compression='uncompressed')


def keywords(destination: Path, dfs: pd.DataFrame, n_clusters: int = 20, cluster_depth: int = 10):
    print('  - kmeans')
    positions = dfs[['x', 'y']]
    kmeans = KMeans(n_clusters=n_clusters, random_state=0, n_init='auto').fit(positions)
    classes = np.unique(kmeans.labels_)

    print('  - titles')
    cluster_titles = ['' for _ in classes]
    for li, ll in enumerate(kmeans.labels_):
        tit = dfs.iloc[li]['title']
        if tit is not None:
            cluster_titles[ll] += tit

    print('  - tfidf')
    vectorizer = TfidfVectorizer(lowercase=True, stop_words='english', ngram_range=(1, 3), min_df=1, max_df=0.6,
                                 strip_accents='ascii')
    tfidf = vectorizer.fit_transform(cluster_titles)
    iv = {v: k for k, v in vectorizer.vocabulary_.items()}

    print('  - keywords')
    cluster_keywords = [
        sorted([(iv[kwi], tfidf[ci, kwi]) for kwi in cluster_rank[:cluster_depth]], key=lambda x: x[1], reverse=True)
        for ci, cluster_rank in enumerate(np.argpartition(-tfidf.todense(), axis=1, kth=cluster_depth).tolist())
    ]

    print('  - transform')
    geojson = {
        "type": "FeatureCollection",
        "name": "TAKEOFFLOCATION",
        "features": []
    }
    for ci, kwds in enumerate(cluster_keywords):
        centroid = [kmeans.cluster_centers_[ci, 0], kmeans.cluster_centers_[ci, 1]]
        cluster_points = dfs[kmeans.labels_ == ci][['x', 'y']]
        extent = [cluster_points.min(), cluster_points.max()]
        coordinates = centroid
        for depth, (keyword, size) in enumerate(kwds):
            if depth > 0:
                coordinates = [random.uniform(extent[0]['x'], extent[1]['x']),
                               random.uniform(extent[0]['y'], extent[1]['y'])]

            geojson['features'].append({
                "type": "Feature",
                "properties": {
                    "kwds": keyword,
                    "cluster": ci,
                    "size": 1000 + (size * 25000000 / (100 * (depth + 1)))
                },
                "geometry": {"type": "Point", "coordinates": coordinates}
            })
    with open(destination, 'w') as f:
        json.dump(geojson, f)


print('geojson')
keywords(GEOJSON, df_full, n_clusters=20, cluster_depth=10)
