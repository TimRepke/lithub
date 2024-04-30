import math
import random
from pathlib import Path
import pandas as pd
import numpy as np
import pyarrow as pa
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer

KEYWORDS = Path('.data/healthmap/keywords.arrow')
df = pd.read_feather('.data/healthmap/raw/full.arrow')
df = df.replace({np.nan: None})

CHUNK_SIZE = 1000
N_CLUSTERS = 40
CLUSTER_DEPTH = 20

df = df.replace({np.nan: None})
dfs = df[['idx', 'x', 'y', 'title']]
dfs['idx'] = dfs['idx'].astype("Int64")
dfs[['x', 'y']] = dfs[['x', 'y']].astype("float16")

maxs = dfs[['x', 'y']].max(axis=0)
mins = dfs[['x', 'y']].min(axis=0)
spans = np.sqrt(np.power(mins - maxs, 2))

dfs['x'] = (dfs['x'] - mins['x']) / spans['x']
dfs['y'] = (dfs['y'] - mins['y']) / spans['y']

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
            'level': depth + 1,
            'keyword': keyword
        })

df_kws = pd.DataFrame(keywords)
df_kws['level'] = df_kws['level'].astype("Int64")
df_kws[['x', 'y']] = df_kws[['x', 'y']].astype("float16")

schema = pa.schema([
    ('x', pa.float16()),
    ('y', pa.float16()),
    ('level', pa.uint8()),
    ('keyword', pa.string())
])

print(f'Writing {KEYWORDS}')
with pa.OSFile(str(KEYWORDS), 'wb') as sink:
    with pa.ipc.new_stream(sink, schema) as writer:
        n_chunks = int(math.ceil(df_kws.shape[0] / CHUNK_SIZE))
        for chunk in range(n_chunks):
            tmp = df_kws[chunk * CHUNK_SIZE:(chunk + 1) * CHUNK_SIZE]
            batch = pa.record_batch(tmp, schema)
            writer.write(batch)
print(f'Wrote {KEYWORDS}')
