import math
import random
from pathlib import Path
import pandas as pd
import numpy as np
import pyarrow as pa
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer

df = pd.read_csv('../../.data/cdrmap/raw/literature_hub_cdrmap_full.csv', lineterminator='\n')
df = df.replace({np.nan: None})

VECTORS = Path('../../.data/cdrmap/raw/vectors.npy')
KEYWORDS = Path('../../.data/cdrmap/keywords.arrow')

CHUNK_SIZE = 1000
N_CLUSTERS = 40
CLUSTER_DEPTH = 20

schema = pa.schema([
    ('x', pa.float16()),
    ('y', pa.float16()),
    ('level', pa.uint8()),
    ('keyword', pa.string())
])

with open(VECTORS, 'rb') as f:
    embedding = np.load(f)

maxs = embedding.max(axis=0)
mins = embedding.min(axis=0)
spans = np.sqrt(np.power(mins - maxs, 2))

tmp = []
df = df.replace({np.nan: None})
for idx, ((_, row), vector) in enumerate(zip(df.iterrows(), embedding)):
    tmp.append({
        'idx': idx,
        'x': (vector[0] - mins[0]) / spans[0],
        'y': (vector[1] - mins[1]) / spans[1],
        'title': row['title'],
        'text': row['abstract'],
    })
dfs = pd.DataFrame(tmp)
dfs['idx'] = dfs['idx'].astype("Int64")
dfs[['x', 'y']] = dfs[['x', 'y']].astype("float16")

print('  - kmeans')
positions = dfs[['x', 'y']]
kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=0, n_init='auto').fit(positions)
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
    sorted([(iv[kwi], tfidf[ci, kwi]) for kwi in cluster_rank[:CLUSTER_DEPTH]], key=lambda x: x[1], reverse=True)
    for ci, cluster_rank in enumerate(np.argpartition(-tfidf.todense(), axis=1, kth=CLUSTER_DEPTH).tolist())
]

print('  - transform')
keywords = []
for ci, kwds in enumerate(cluster_keywords):
    centroid = [kmeans.cluster_centers_[ci, 0], kmeans.cluster_centers_[ci, 1]]
    cluster_points = dfs[kmeans.labels_ == ci][['x', 'y']]
    extent = [cluster_points.min(), cluster_points.max()]
    coordinates = centroid
    for depth, (keyword, size) in enumerate(kwds):
        if depth > 0:
            coordinates = [random.uniform(extent[0]['x'], extent[1]['x']),
                           random.uniform(extent[0]['y'], extent[1]['y'])]
        keywords.append({
            'x': coordinates[0],
            'y': coordinates[1],
            'level': depth,
            'keyword': keyword
            # "cluster": ci,
            # "size": 1000 + (size * 25000000 / (100 * (depth + 1)))
        })

df_kws = pd.DataFrame(keywords)
df_kws["level"] = df_kws["level"]+1

level_0_data = [
    [30,-15,'Biochar'],
    [-60,5,'CCS'],
    [-20,-40,'DAC(CS)'],
    [-10,50,'Afforestation/Reforestation'],
    [0,2,'Ocean fertilization & Artificial upwelling'],
    [-27,38,'BECCS'],
    [-27,27,'General Literature on CDR'],
    [-10,-20,'Enhanced Weathering (land based)'],
    [-15,70,'Blue carbon'],
    [0,7,'Ocean alkalinity enhancement'],
    [30,55,'Soil Carbon Sequestration'],
    [10,65,'Restoration of landscapes/peats'],
]
level_0 = pd.DataFrame(level_0_data, columns=['x','y','keyword'])
level_0["level"] = 0

df_kws = pd.concat([level_0[['x','y','level','keyword']],df_kws])

df_kws['level'] = df_kws['level'].astype("Int64")
df_kws[['x', 'y']] = df_kws[['x', 'y']].astype("float16")

print(f'Writing {KEYWORDS}')
with pa.OSFile(str(KEYWORDS), 'wb') as sink:
    with pa.ipc.new_stream(sink, schema) as writer:
        n_chunks = int(math.ceil(df_kws.shape[0] / CHUNK_SIZE))
        for chunk in range(n_chunks):
            tmp = df_kws[chunk * CHUNK_SIZE:(chunk + 1) * CHUNK_SIZE]
            batch = pa.record_batch(tmp, schema)
            writer.write(batch)
print(f'Wrote {KEYWORDS}')
