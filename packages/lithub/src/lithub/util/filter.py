import pandas as pd
from lithub.models.labels import Group


def mask_df(
    df: pd.DataFrame,
    group: Group | None = None,
    min_py: int | None = None,
    max_py: int | None = None,
    rel_col: str | None = None,
    py_col: str = 'publication_year',
) -> pd.Series:
    mask = df.index.notna()

    if rel_col in df.columns:
        mask &= df[rel_col] > 0.5

    if group is not None:
        mask &= (df[[li.column for li in group.labels]] > 0.5).any(axis=1)
    if min_py is not None:
        mask &= df[py_col] >= min_py
    if max_py is not None:
        mask &= df[py_col] <= max_py

    return mask
