from typing import Callable

import openTSNE
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer

import numpy as np
import pandas as pd

Extent = tuple[float, float]


def get_vectors(cache: Path, df: pd.DataFrame, to_txt: Callable[[pd.Series], str],
                perp: int = 30, metric: str = 'cosine', dof: float = 0.8,
                min_df: float = 0.01, max_df: float = 0.9, max_feat: int = 5000) -> tuple[
    openTSNE.TSNEEmbedding, Extent, Extent, Extent]:
    if cache.exists():
        print('Loading existing vectors...')
        with open(cache, 'rb') as f:
            embedding = np.load(f)
    else:
        print('Vectorising dataset...')
        vectoriser = TfidfVectorizer(stop_words='english', lowercase=True, min_df=min_df, max_df=max_df,
                                     max_features=max_feat)
        vectors = vectoriser.fit_transform([to_txt(r) for _, r in df.iterrows()])
        print(vectors.shape)
        vectors = vectors.todense()
        vectors = np.asarray(vectors)

        print('Reducing dimensionality...')
        tsne = openTSNE.TSNE(
            perplexity=perp,
            metric=metric,
            n_jobs=8,
            random_state=42,
            verbose=True,
            dof=dof
        )
        embedding = tsne.fit(vectors)

        print('Saving vectors for next time...')
        with open(cache, 'wb') as f:
            np.save(f, embedding)

    print('Find projection span...')
    maxs = embedding.max(axis=0)
    mins = embedding.min(axis=0)
    spans = np.sqrt(np.power(mins - maxs, 2))

    return embedding, mins, maxs, spans
