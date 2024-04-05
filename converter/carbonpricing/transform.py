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

df = pd.read_csv('data/carbonprice.csv')
df = df.replace({np.nan: None})

VECTORS = Path('data/carbonprice.vectors.npy')
OUT_SLIM = Path('frontend/public/carbonprice.min.arrow')
OUT_FULL = Path('data/carbonprice.full.arrow')
GEOJSON = Path('data/carbonprice.geojson')

LABELS = {
    'cp': {
        'name': 'Carbon Price',
        'type': 'single',
        'values': {0: 'No', 1: 'Yes'},
    },
    'imp': {
        'name': 'Implemented policy',
        'type': 'single',
        'values': {0: 'No', 1: 'Yes', 2: 'maybe'}
    },
    'exp': {
        'name': 'Ex-post/ex-ante',
        'type': 'single',
        'values': {0: 'ex-ante', 1: 'ex-post', 2: 'unclear'}
    },
    'meth': {
        'name': 'Method',
        'type': 'single',
        'values': {0: 'quasi-experiment', 1: 'statistical inference', 2: 'other quantitative', 3: 'survey/interview',
                   4: 'review', 5: 'other'}
    },
    'outc': {
        'name': 'Analysed outcome',
        'type': 'multi',
        'values': {0: 'Environmental effectiveness', 1: 'Leakage', 2: 'Innovation & Investment',
                   3: 'Firm behaviour & Economic structure', 4: 'Prices of goods & services', 5: 'Household behaviour',
                   6: 'Competitiveness', 7: 'Employment & Labour market', 8: 'Distribution & Fairness',
                   9: 'Cost effectiveness & Efficiency', 10: 'Implementation process & feasibility',
                   11: '(Public) Perception', 12: 'other', 13: 'unknown', 14: 'environmental or health co-benefits'}
    },
    'polname': {
        'name': 'Policy name',
        'type': 'multi',
        'values': {0: 'multiple', 1: 'unclear', 2: 'other', 3: 'China national ETS', 4: 'China regional ETS pilots',
                   5: 'EU ETS', 6: 'British Columbia carbon tax', 7: 'California ETS', 8: 'Quebec ETS', 9: 'RGGI',
                   10: 'Alberta ETS', 11: 'Argentina carbon tax', 12: 'Austria ETS', 13: 'Baja California carbon tax',
                   14: 'Beijing pilot ETS', 15: 'Canada federal carbon tax', 16: 'Canada federal ETS',
                   17: 'Chile carbon tax', 18: 'Chongqing pilot ETS', 19: 'Colombia carbon tax',
                   20: 'Denmark carbon tax', 21: 'Estonia carbon tax', 22: 'Finland carbon tax',
                   23: 'France carbon tax', 24: 'Fujian pilot ETS', 25: 'Germany ETS', 26: 'Guangdong pilot ETS',
                   27: 'Hubei pilot ETS', 28: 'Iceland carbon tax', 29: 'Indonesia carbon tax',
                   30: 'Ireland carbon tax', 31: 'Japan carbon tax', 32: 'Kazakhstan ETS', 33: 'Korea ETS',
                   34: 'Latvia carbon tax', 35: 'Lichtenstein carbon tax', 36: 'Luxembourg carbon tax',
                   37: 'Massachusetts ETS', 38: 'Mexico carbon tax', 39: 'Mexico ETS', 40: 'Netherlands carbon tax',
                   41: 'New Brunswick carbon tax', 42: 'New Brunswick ETS', 43: 'New Zealand ETS',
                   44: 'Newfoundland and Labrador carbon tax', 45: 'Newfoundland and Labrador ETS',
                   46: 'Northwest Territories carbon tax', 47: 'Norway carbon tax', 48: 'Nova Scotia ETS',
                   49: 'Ontario ETS', 50: 'Oregon ETS', 51: 'Poland carbon tax', 52: 'Portugal carbon tax',
                   53: 'Prince Edward Island carbon tax', 54: 'Saitama ETS', 55: 'Saskatchewan ETS',
                   56: 'Shanghai pilot ETS', 57: 'Shenzhen pilot ETS', 58: 'Singapore carbon tax',
                   59: 'Slovenia carbon tax', 60: 'South Africa carbon tax', 61: 'Spain carbon tax',
                   62: 'Sweden carbon tax', 63: 'Switzerland carbon tax', 64: 'Switzerland ETS',
                   65: 'Tamaulipas carbon tax', 66: 'Tianjin pilot ETS', 67: 'Tokyo ETS', 68: 'UK carbon price support',
                   69: 'UK ETS', 70: 'Ukraine carbon tax', 71: 'Uruguay carbon tax', 72: 'Zacatecas carbon tax',
                   73: 'Australia ETS'}
    },
    'sect': {
        'name': 'Sector',
        'type': 'multi',
        'values': {0: 'Energy', 1: 'Industry', 2: 'Transport', 3: 'Buildings', 4: 'AFOLU', 5: 'Aviation and shipping'}
    },
    'otherpol': {
        'name': 'Interaction with other policies',
        'type': 'bool',
        'values': {True: 'yes', False: 'no'}
    }
}

print(' '.join([
    f'"{key}|{int(value)}=bool_"'
    for key, label in LABELS.items()
    for value in label['values'].keys()
]))

if VECTORS.exists():
    with open(VECTORS, 'rb') as f:
        embedding = np.load(f)
else:
    vectoriser = TfidfVectorizer(stop_words='english', lowercase=True, min_df=0.01, max_df=0.9, max_features=5000)
    vectors = vectoriser.fit_transform([r['text'] or '' for _, r in df.iterrows()])
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
    # ,,openalex_id,,
    # ,title_slug,,,,,meta,,project_id,,array_agg
    blank = {
        f'{key}|{int(value)}': None
        for key, label in LABELS.items()
        for value in label['values'].keys()
    }
    out = {
        'idx': idx,
        # 'item_id': row['item_id'],
        'x': (vector[0] - mins[0]) / spans[0],
        'y': (vector[1] - mins[1]) / spans[1],
        'publication_year': row['publication_year'],
        **blank
    }
    if row['labels'] and row['labels'] != '[null]':
        labels = json.loads(row['labels'])
        for label in labels:
            info = LABELS[label['key']]
            if info['type'] == 'bool':
                out[f'{label["key"]}|{int(label["value_bool"] or False)}'] = 1
            elif info['type'] == 'single':
                out[f'{label["key"]}|{label["value_int"] or 0}'] = 1
            elif info['type'] == 'multi':
                for value in label['multi_int']:
                    out[f'{label["key"]}|{value}'] = 1

    out_slim.append(out)
    out_full.append({**out,
                     **{
                         'text': row['text'],
                         'doi': row['doi'],
                         's2_id': row['s2_id'],
                         'wos_id': row['wos_id'],
                         'scopus_id': row['scopus_id'],
                         'pubmed_id': row['pubmed_id'],
                         'openalex_id': row['openalex_id'],
                         'dimensions_id': row['dimensions_id'],
                         'title': row['title'],
                         'source': row['source'],
                         'keywords': row['keywords'],
                         'authors': row['authors'],
                     }})

df_slim = pd.DataFrame(out_slim)
df_full = pd.DataFrame(out_full)
print(dict(df_full.dtypes))

cols = [f'{key}|{int(value)}'
        for key, label in LABELS.items()
        for value in label['values'].keys()]
cols += ['publication_year', 'idx']

df_slim[cols] = df_slim[cols].astype("Int64")
df_full[cols] = df_full[cols].astype("Int64")
df_slim[['x', 'y']] = df_slim[['x', 'y']].astype("float16")
df_full[['x', 'y']] = df_full[['x', 'y']].astype("float16")

CHUNK_SIZE = 5000
CHUNK_PATH = Path('data/chunks/')
CHUNK_PATH.mkdir(parents=True, exist_ok=True)

schema = pa.schema([('idx', pa.uint32()),
                    ('x', pa.float16()),
                    ('y', pa.float16()),
                    ('publication_year', pa.uint16())] + [
                       (f'{key}|{int(value)}', pa.bool_())
                       for key, label in LABELS.items()
                       for value in label['values'].keys()
                   ])
schema_full = pa.schema([
                            ('idx', pa.uint32()),
                            ('x', pa.float16()),
                            ('y', pa.float16()),
                            ('publication_year', pa.uint16())
                        ] + [
                            (f'{key}|{int(value)}', pa.bool_())
                            for key, label in LABELS.items()
                            for value in label['values'].keys()
                        ] + [
                            ('text', pa.string()),
                            ('doi', pa.string()),
                            ('s2_id', pa.string()),
                            ('wos_id', pa.string()),
                            ('scopus_id', pa.string()),
                            ('pubmed_id', pa.string()),
                            ('openalex_id', pa.string()),
                            ('dimensions_id', pa.string()),
                            ('title', pa.string()),
                            ('source', pa.string()),
                            ('keywords', pa.string()),
                            ('authors', pa.string()),
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
    #
    # data = [
    #     pa.array([1, 2, 3, 4]),
    #     pa.array(['foo', 'bar', 'baz', None]),
    #     pa.array([True, None, False, True])
    # ]
    #
    # batch = pa.record_batch(data, names=['f0', 'f1', 'f2'])
    # with pa.ipc.new_stream(str(target), batch.schema) as writer:
    #     for i in range(5):
    #         writer.write_batch(batch)

    # table = pa.Table.from_pandas(sub, preserve_index=False, schema=scm)
    # writer = pa.ipc.new_file(str(target), scm)
    # feather.write_feather(table, str(target), chunksize=CHUNK_SIZE, compression='uncompressed')
    # writer.close()
    with pa.OSFile(str(target), 'wb') as sink:
        with pa.ipc.new_stream(sink, scm) as writer:
            n_chunks = int(math.ceil(sub.shape[0] / CHUNK_SIZE))
            for chunk in range(n_chunks):
                tmp = sub[chunk * CHUNK_SIZE:(chunk + 1) * CHUNK_SIZE]
                batch = pa.record_batch(tmp, scm)
                # print(f'chunk {chunk}: {tmp.shape}')
                writer.write(batch)
    print(f'Wrote {target}')


print(df_slim.shape)
# for chunk in range(math.ceil(df_slim.shape[0] / CHUNK_SIZE)):
#     write_table(str(CHUNK_PATH / f'chunk-{chunk:04}.arrow'), df_slim[chunk * CHUNK_SIZE:(chunk + 1) * CHUNK_SIZE])

write_table_ipc(OUT_SLIM, df_slim, schema)
# write_table_ipc(OUT_FULL, df_full, schema_full)

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
