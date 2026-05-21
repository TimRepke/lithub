from pathlib import Path
from typing import TypedDict, Annotated

import pandas as pd
import typer
import numpy as np

from lithub.util.disk import read_any_pd, write_any_df
from lithub.util.logging import get_logger
from lithub.util.text import text_from_table, text_utils


class Keyword(TypedDict):
    x: float
    y: float
    keyword: str
    level: int


def text_based(
    source_scatter: Annotated[Path, typer.Option(help='')],
    source_items: Annotated[Path, typer.Option(help='')],
    target: Annotated[Path, typer.Option(help='')],
    n_clusters: Annotated[list[int], typer.Option(help='')],
    level_offset: Annotated[int, typer.Option(help='')] = 0,
    limit: Annotated[int | None, typer.Option(help='')] = None,
    n_cpus: Annotated[int, typer.Option(help='Parallelisation')] = 1,
    loglevel: Annotated[str, typer.Option(help='Verbosity of logger')] = 'INFO',
) -> None:
    from sklearn.cluster import KMeans
    from sklearn.feature_extraction.text import TfidfVectorizer
    from parallel_pandas import ParallelPandas

    ParallelPandas.initialize(n_cpu=n_cpus, split_factor=4, disable_pr_bar=True)

    logger = get_logger(loglevel=loglevel, logger_name='keywords', run_log_init=True)

    logger.info('Loading aggressive text util')
    _, process_text_aggressive, _ = text_utils()

    logger.info('Loading data')
    df_scatter = read_any_pd(source_scatter, index_column='item_id').join(
        text_from_table(read_any_pd(source_items, index_column='item_id')).to_frame(name='text'),
    )
    df_scatter = df_scatter[df_scatter['text'].notna()]
    if limit is not None:
        df_scatter = df_scatter.sample(frac=1).iloc[:limit]
    logger.info(f'Processing text for {df_scatter.shape}')
    df_scatter['text'] = df_scatter['text'].p_map(lambda txt: process_text_aggressive(txt, pos_filter={'ADV', 'DET', 'VERB', 'VBZ', 'RB'}))

    keyword_positions: list[Keyword] = []
    groups = [['level_0']]
    df_scatter['level_0'] = np.zeros(len(df_scatter))

    for level, n_cluster in enumerate(n_clusters, start=1):
        logger.info(f'Working on level {level} (n={n_cluster}) with {len(df_scatter.groupby(groups[level - 1]))} groups')
        df_scatter[f'level_{level}'] = 0
        for _, cluster in df_scatter.groupby(groups[level - 1]):
            if len(cluster) <= n_cluster:
                continue
            df_scatter.loc[cluster.index, f'level_{level}'] = KMeans(n_clusters=n_cluster).fit_predict(cluster[['x', 'y']])
        groups.append([f'level_{li}' for li in range(level + 1)])

    seen_terms: set[str] = set()
    for group in groups[1:]:
        logger.info(f'Working on placements for group {group}')
        pseudo_docs = df_scatter.groupby(group)['text'].apply(lambda grp: ','.join(grp))

        logger.info('Vectorising...')
        vzr = TfidfVectorizer(ngram_range=(1, 3), max_df=0.5, min_df=1, stop_words=None)  # , vocabulary=vocabulary.values() if vocabulary else None)
        vecs = vzr.fit_transform(pseudo_docs)
        vocabulary = {v: k for k, v in vzr.vocabulary_.items()}
        logger.info(f'Placing keywords (from vocab with {len(vocabulary):,} vocab size for {len(pseudo_docs):,} pseudo docs)')
        for (_, grp), vector in zip(df_scatter.groupby(group), vecs, strict=True):
            centroid = grp[['x', 'y']].mean()

            # faster equivalent to `token_idxs = np.asarray(vector.todense())[0].argsort()`
            token_idxs = vector.indices[np.argsort(vector.data)[::-1]]

            for token_idx in token_idxs:
                if vocabulary[token_idx] not in seen_terms:
                    keyword_positions.append(
                        Keyword(
                            x=float(centroid['x']),
                            y=float(centroid['y']),
                            keyword=vocabulary[token_idx],
                            level=len(group) + level_offset,
                        ),
                    )
                    seen_terms.add(vocabulary[token_idx])
                    break
        logger.info(f'Placed {len(keyword_positions):,} keywords so far')
    write_any_df(df=pd.DataFrame(keyword_positions), target=target)


if __name__ == '__main__':
    typer.run(text_based)
