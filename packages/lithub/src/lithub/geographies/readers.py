from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

from lithub.util.disk import read_any_pd
from .utils import fix_geographies, get_naming_mask

here = Path(__file__).parent.resolve()

HDI_MAP = {
    'Very High': 'Very High or High',
    'High': 'Very High or High',
    'Medium': 'Low or Medium',
    'Low': 'Low or Medium',
}


def load_country_infos() -> pd.DataFrame:
    return (
        pd.read_csv(here / '_countries.csv', dtype=str, keep_default_na=False)
        .map(str.strip, na_action='ignore')
        .replace({'': pd.NA, np.nan: pd.NA})
        .astype(
            {'Population (Lancet, 2025)': 'Int32', 'iso_num': 'Int32'},
        )
        .assign(
            **{
                'Group (HDI-2 2026)': lambda data: data['Group (HDI 2026)'].map(lambda v: HDI_MAP[v] if v in HDI_MAP else pd.NA),
                'Group (HDI-2 2025)': lambda data: data['Group (HDI 2025)'].map(lambda v: HDI_MAP[v] if v in HDI_MAP else pd.NA),
            }
        )
    )


def _read_places_df(
    source: Path,
    index_column: str | None = 'item_id',
    resolution: float = 2.5,
    merge_taiwan_china: bool = True,
) -> pd.DataFrame:
    df_places = (
        read_any_pd(source, dtype=str, keep_default_na=False, index_column=index_column)
        .replace(
            {'': pd.NA, np.nan: pd.NA},
        )
        .astype(
            {
                'lat': 'Float64',
                'lon': 'Float64',
                'score': 'Float64',
                # 'city_id': 'Int32',
                'end_char': 'Int32',
                'start_char': 'Int32',
                'geonameid': 'Int32',
            },
        )
        .replace(
            {'': pd.NA, np.nan: pd.NA},
        )
    )
    df_places['LAT'] = df_places['lat'] // resolution * resolution + (resolution / 2)
    df_places['LON'] = df_places['lon'] // resolution * resolution + (resolution / 2)
    df_places['location_id'] = np.arange(df_places.shape[0])
    if merge_taiwan_china:
        df_places.loc[df_places['country_code3'] == 'TWN', 'country_code3'] = 'CHN'

    return df_places


def load_df_places(
    source: Path,
    index_column: str | None = None,
    merge_taiwan_china: bool = True,
) -> tuple[pd.DataFrame, pd.Series]:
    """Load a clean version of extracted places and a filter mask.

    Don't forget to get the additional `get_publisher_mask` after merging df_places with df_base!
    Example usage:

    ```
    df_base = pd.read(main-data)
    df_places, mask_places = load_df_places(source)
    df = df_base.merge(df_places, on='search_name')
    ```

    """
    df = _read_places_df(source, index_column=index_column, merge_taiwan_china=merge_taiwan_china)
    df = fix_geographies(df)
    mask = get_naming_mask(df) & df['geonameid'].notna()
    return df, mask


def read_places_export(
    source: Path,
    df_countries: Optional[pd.DataFrame] = None,
    resolution: float = 2.5,
    merge_taiwan_china: bool = True,
    index_column: str | None = None,
) -> pd.DataFrame:
    df_countries = load_country_infos() if df_countries is None else df_countries
    df_places = _read_places_df(source, index_column=index_column, resolution=resolution, merge_taiwan_china=merge_taiwan_china)
    df = df_places.merge(df_countries, left_on='country_code3', right_on='iso3', how='left')

    return df.replace({np.nan: pd.NA})
