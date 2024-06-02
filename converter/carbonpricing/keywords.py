from pathlib import Path
import pandas as pd
import numpy as np

from converter.kmeans_keywords import get_keywords, write_keywords

BASE = Path('../../.data/carbonpricing')
df = pd.read_feather(BASE / 'raw/full.arrow')
df = df.replace({np.nan: None})

df_kws = get_keywords(df, n_clusters=40, cluster_depth=20, ngram_min=1, ngram_max=3, min_df=1, max_df=0.6)
write_keywords(df_kws, fname=BASE / 'keywords.arrow', chunk_size=1000)
