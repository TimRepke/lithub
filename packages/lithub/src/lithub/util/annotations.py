import logging
from pathlib import Path

import pandas as pd

from lithub.models import Group
from lithub.util.disk import read_any_pd


def replace_human_annotations(
    df: pd.DataFrame,
    source: Path,
    LABELS: dict[str, Group],
    logger: logging.Logger,
) -> pd.DataFrame:
    logger.info('Override predictions with human annotations')

    # Load human annotations
    df_human = read_any_pd(source, index_column='item_id')
    for group in LABELS.values():
        if group.collection not in {'MAIN'}:
            continue
        for label in group.labels:
            # Make sure all values are within range and not exactly 0 or 1
            df[label.column] = df[label.column].clip(lower=0.01, upper=0.99)

            for val in [0, 1]:
                mask = df_human[label.column] == val
                item_ids = df_human[mask]['item_id'].tolist()
                df.loc[df.index.isin(item_ids), label.column] = val

            logger.debug(f' > Human {label.column}==1: {(df[label.column] == 1).sum():,} | {label.column}==0: {(df[label.column] == 0).sum():,}')

    return df
