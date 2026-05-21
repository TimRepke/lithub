from pathlib import Path
from typing import Any

import pandas as pd


def read_any_pd(source: Path, index_column: str | None = None, **kwargs: Any) -> pd.DataFrame:
    kwargs = kwargs or {}
    if source.suffix == '.csv':
        kwargs_ = {k: v for k, v in kwargs.items() if k in pd.read_csv.__annotations__}
        df = pd.read_csv(source, **kwargs_)
    elif source.suffix == '.feather' or source.suffix == '.arrow':
        kwargs_ = {k: v for k, v in kwargs.items() if k in pd.read_feather.__annotations__}
        df = pd.read_feather(source, **kwargs_)
    elif source.suffix == '.parquet':
        kwargs_ = {k: v for k, v in kwargs.items() if k in pd.read_parquet.__annotations__}
        df = pd.read_parquet(source, **kwargs_)
    else:
        raise ValueError(f'Unsupported file type: {source.suffix}')

    if index_column is not None:
        return df.set_index(index_column, drop=True)
    return df


def write_any_df(df: pd.DataFrame, target: Path, **kwargs: Any) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    kwargs = {'index': False} | (kwargs or {})
    if target.suffix == '.csv':
        kwargs_ = {k: v for k, v in kwargs.items() if k in pd.DataFrame.to_csv.__annotations__}
        df.to_csv(target, **kwargs_)
    elif target.suffix == '.feather' or target.suffix == '.arrow':
        kwargs_ = {k: v for k, v in kwargs.items() if k in pd.DataFrame.to_feather.__annotations__}
        df.to_feather(target, **kwargs_)
    elif target.suffix == '.parquet':
        kwargs_ = {k: v for k, v in kwargs.items() if k in pd.DataFrame.to_parquet.__annotations__}
        df.to_parquet(target, **kwargs_)
    else:
        raise ValueError(f'Unsupported file type: "{target.suffix}"')
