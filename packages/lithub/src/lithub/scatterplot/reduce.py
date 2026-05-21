import re
from pathlib import Path
from typing import Annotated

import numpy as np
import typer
import pickle
import pandas as pd

from lithub.util.disk import read_any_pd, write_any_df
from lithub.util.logging import get_logger


def reduce_text_distribution(
    source: Annotated[Path, typer.Option(help='Path to file containing topic scores')],
    target: Annotated[Path, typer.Option(help='Path to output file')],
    model_path: Annotated[Path, typer.Option(help='Path pickled fitted UMAP')],
    n_jobs: Annotated[int, typer.Option(help='Number of CPU cores for UMAP (-1 == all cores)')] = -1,
    verbose_umap: Annotated[bool, typer.Option(help='')] = True,
    loglevel: Annotated[str, typer.Option(help='Verbosity of logger')] = 'INFO',
) -> None:
    from sklearn.feature_extraction.text import TfidfVectorizer

    logger = get_logger(loglevel=loglevel, logger_name='dimension-reduction', run_log_init=True)

    logger.info(f'Reading topic distribution from {source}')
    df_source = read_any_pd(source, index_column='item_id')
    logger.info(f'Found data with shape {df_source.shape}')

    logger.info('Preparing texts...')
    NON_ALPHA = re.compile(r'\W+')
    texts = df_source.replace({np.nan: '', None: ''}).apply(lambda row: NON_ALPHA.sub(' ', re.escape(f'{row["title"]}. {row["abstract"]}')), axis=1)

    logger.info('Fitting tf-idf vectors...')
    vectoriser = TfidfVectorizer(stop_words='english', ngram_range=(1, 3), min_df=0.02, max_df=0.8)
    vectors = vectoriser.fit_transform(texts)
    logger.info(f'  -> Vectors shape {vectors.shape}')

    if not model_path.exists():
        logger.info('Fitting reducer (no existing reducer found)...')
        if 'umap' in model_path.name:
            import umap

            reducer = umap.UMAP(
                min_dist=0.8,
                n_neighbors=50,
                repulsion_strength=5,
                n_jobs=n_jobs,
                verbose=verbose_umap,
            )
            embedding = reducer.fit_transform(vectors)

        else:
            from openTSNE import TSNE

            reducer = TSNE(
                n_components=2,
                perplexity=30,
                dof=1,
                initialization='pca',
                metric='euclidean',  # cosine
                # neighbors='pynndescent',
                n_jobs=n_jobs,
                random_state=43,
                verbose=True,
            )
            embedding = reducer.fit(np.asarray(vectors.todense()))

        logger.info('Storing reducer...')
        with open(model_path.as_posix(), 'wb') as fp_model:
            pickle.dump(reducer, fp_model)
    else:
        logger.info('Loading existing reducer...')
        with open(model_path, 'rb') as fp_model:
            reducer = pickle.load(fp_model)

        logger.info('Transforming data...')
        embedding = reducer.transform(vectors)

    logger.info('Constructing output table...')
    df_scatter = pd.DataFrame(
        {
            'item_id': df_source.index,
            'x': embedding[:, 0],
            'y': embedding[:, 1],
        },
    )
    write_any_df(df_scatter, target)


if __name__ == '__main__':
    typer.run(reduce_topic_distribution)
