import math
import random
from pathlib import Path
import pandas as pd
import numpy as np
import pyarrow as pa
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer


def get_keywords(df, n_clusters: int = 40, cluster_depth: int = 20, ngram_min: int = 1, ngram_max: int = 3,
                 min_df: int | float = 1, max_df: float = 0.6):
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
    kmeans = KMeans(n_clusters=n_clusters, random_state=0, n_init='auto').fit(positions)
    classes = np.unique(kmeans.labels_)

    print('  - titles')
    cluster_titles = ['' for _ in classes]
    for li, ll in enumerate(kmeans.labels_):
        tit = dfs.iloc[li]['title']
        if tit is not None:
            cluster_titles[ll] += tit

    print('  - tfidf')
    vectorizer = TfidfVectorizer(lowercase=True, stop_words='english', ngram_range=(ngram_min, ngram_max),
                                 min_df=min_df, max_df=max_df, strip_accents='ascii')
    tfidf = vectorizer.fit_transform(cluster_titles)
    iv = {v: k for k, v in vectorizer.vocabulary_.items()}

    print('  - keywords')
    cluster_keywords = [
        sorted([(iv[kwi], tfidf[ci, kwi]) for kwi in cluster_rank[:cluster_depth]], key=lambda x: x[1], reverse=True)
        for ci, cluster_rank in enumerate(np.argpartition(-tfidf.todense(), axis=1, kth=cluster_depth).tolist())
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

    return df_kws


def write_keywords(df_kws, fname: Path, chunk_size: int = 10000):
    schema = pa.schema([
        ('x', pa.float16()),
        ('y', pa.float16()),
        ('level', pa.uint8()),
        ('keyword', pa.string())
    ])

    print(f'Writing {fname}')
    with pa.OSFile(str(fname), 'wb') as sink:
        with pa.ipc.new_stream(sink, schema) as writer:
            n_chunks = int(math.ceil(df_kws.shape[0] / chunk_size))
            for chunk in range(n_chunks):
                tmp = df_kws[chunk * chunk_size:(chunk + 1) * chunk_size]
                batch = pa.record_batch(tmp, schema)
                writer.write(batch)
    print(f'Wrote {fname}')
