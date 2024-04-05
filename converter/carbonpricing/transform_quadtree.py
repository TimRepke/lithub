import math
from pathlib import Path
import json
import pandas as pd
import numpy as np
import openTSNE
from sklearn.feature_extraction.text import TfidfVectorizer
import pyarrow as pa

df = pd.read_csv('data/carbonprice.csv')
df = df.replace({np.nan: None})

VECTORS = Path('data/carbonprice.vectors.npy')
OUT_SLIM = Path('data/carbonprice.min.feather')

LABELS = {
    'cp': {
        'name': 'Carbon Price',
        'type': 'single',
        'values': {0: 'No', 1: 'Yes'},
    },
    'imp': {
        'name': 'Implemented policy',
        'type': 'single',
        'values': {0: 'No', 1: 'Yes', 2: 'maybe'}
    },
    'exp': {
        'name': 'Ex-post/ex-ante',
        'type': 'single',
        'values': {0: 'ex-ante', 1: 'ex-post', 2: 'unclear'}
    },
    'meth': {
        'name': 'Method',
        'type': 'single',
        'values': {0: 'quasi-experiment', 1: 'statistical inference', 2: 'other quantitative', 3: 'survey/interview',
                   4: 'review', 5: 'other'}
    },
    'outc': {
        'name': 'Analysed outcome',
        'type': 'multi',
        'values': {0: 'Environmental effectiveness', 1: 'Leakage', 2: 'Innovation & Investment',
                   3: 'Firm behaviour & Economic structure', 4: 'Prices of goods & services', 5: 'Household behaviour',
                   6: 'Competitiveness', 7: 'Employment & Labour market', 8: 'Distribution & Fairness',
                   9: 'Cost effectiveness & Efficiency', 10: 'Implementation process & feasibility',
                   11: '(Public) Perception', 12: 'other', 13: 'unknown', 14: 'environmental or health co-benefits'}
    },
    'polname': {
        'name': 'Policy name',
        'type': 'multi',
        'values': {0: 'multiple', 1: 'unclear', 2: 'other', 3: 'China national ETS', 4: 'China regional ETS pilots',
                   5: 'EU ETS', 6: 'British Columbia carbon tax', 7: 'California ETS', 8: 'Quebec ETS', 9: 'RGGI',
                   10: 'Alberta ETS', 11: 'Argentina carbon tax', 12: 'Austria ETS', 13: 'Baja California carbon tax',
                   14: 'Beijing pilot ETS', 15: 'Canada federal carbon tax', 16: 'Canada federal ETS',
                   17: 'Chile carbon tax', 18: 'Chongqing pilot ETS', 19: 'Colombia carbon tax',
                   20: 'Denmark carbon tax', 21: 'Estonia carbon tax', 22: 'Finland carbon tax',
                   23: 'France carbon tax', 24: 'Fujian pilot ETS', 25: 'Germany ETS', 26: 'Guangdong pilot ETS',
                   27: 'Hubei pilot ETS', 28: 'Iceland carbon tax', 29: 'Indonesia carbon tax',
                   30: 'Ireland carbon tax', 31: 'Japan carbon tax', 32: 'Kazakhstan ETS', 33: 'Korea ETS',
                   34: 'Latvia carbon tax', 35: 'Lichtenstein carbon tax', 36: 'Luxembourg carbon tax',
                   37: 'Massachusetts ETS', 38: 'Mexico carbon tax', 39: 'Mexico ETS', 40: 'Netherlands carbon tax',
                   41: 'New Brunswick carbon tax', 42: 'New Brunswick ETS', 43: 'New Zealand ETS',
                   44: 'Newfoundland and Labrador carbon tax', 45: 'Newfoundland and Labrador ETS',
                   46: 'Northwest Territories carbon tax', 47: 'Norway carbon tax', 48: 'Nova Scotia ETS',
                   49: 'Ontario ETS', 50: 'Oregon ETS', 51: 'Poland carbon tax', 52: 'Portugal carbon tax',
                   53: 'Prince Edward Island carbon tax', 54: 'Saitama ETS', 55: 'Saskatchewan ETS',
                   56: 'Shanghai pilot ETS', 57: 'Shenzhen pilot ETS', 58: 'Singapore carbon tax',
                   59: 'Slovenia carbon tax', 60: 'South Africa carbon tax', 61: 'Spain carbon tax',
                   62: 'Sweden carbon tax', 63: 'Switzerland carbon tax', 64: 'Switzerland ETS',
                   65: 'Tamaulipas carbon tax', 66: 'Tianjin pilot ETS', 67: 'Tokyo ETS', 68: 'UK carbon price support',
                   69: 'UK ETS', 70: 'Ukraine carbon tax', 71: 'Uruguay carbon tax', 72: 'Zacatecas carbon tax',
                   73: 'Australia ETS'}
    },
    'sect': {
        'name': 'Sector',
        'type': 'multi',
        'values': {0: 'Energy', 1: 'Industry', 2: 'Transport', 3: 'Buildings', 4: 'AFOLU', 5: 'Aviation and shipping'}
    },
    'otherpol': {
        'name': 'Interaction with other policies',
        'type': 'bool',
        'values': {True: 'yes', False: 'no'}
    }
}

if VECTORS.exists():
    with open(VECTORS, 'rb') as f:
        embedding = np.load(f)
else:
    vectoriser = TfidfVectorizer(stop_words='english', lowercase=True, min_df=0.01, max_df=0.9, max_features=5000)
    vectors = vectoriser.fit_transform([r['text'] or '' for _, r in df.iterrows()])
    vectors = vectors.todense()
    vectors = np.asarray(vectors)
    tsne = openTSNE.TSNE(
        perplexity=30,
        metric='euclidean',
        n_jobs=8,
        random_state=42,
        verbose=True,
    )
    embedding = tsne.fit(vectors)
    with open(VECTORS, 'wb') as f:
        np.save(f, embedding)

out_slim = []
out_full = []
for idx, ((_, row), vector) in enumerate(zip(df.iterrows(), embedding)):
    # ,,openalex_id,,
    # ,title_slug,,,,,meta,,project_id,,array_agg
    blank = {
        f'{key}|{int(value)}': None
        for key, label in LABELS.items()
        for value in label['values'].keys()
    }
    out = {
        'idx': idx,
        # 'item_id': row['item_id'],
        'x': vector[0],
        'y': vector[1],
        'publication_year': row['publication_year'],
        **blank
    }
    if row['labels'] and row['labels'] != '[null]':
        labels = json.loads(row['labels'])
        for label in labels:
            info = LABELS[label['key']]
            if info['type'] == 'bool':
                out[f'{label["key"]}|{int(label["value_bool"] or False)}'] = 1
            elif info['type'] == 'single':
                out[f'{label["key"]}|{label["value_int"] or 0}'] = 1
            elif info['type'] == 'multi':
                for value in label['multi_int']:
                    out[f'{label["key"]}|{value}'] = 1

    out_slim.append(out)
    out_full.append({**out,
                     **{
                         'text': row['text'],
                         'doi': row['doi'],
                         's2_id': row['s2_id'],
                         'wos_id': row['wos_id'],
                         'scopus_id': row['scopus_id'],
                         'pubmed_id': row['pubmed_id'],
                         'openalex_id': row['openalex_id'],
                         'dimensions_id': row['dimensions_id'],
                         'title': row['title'],
                         'source': row['source'],
                         'keywords': row['keywords'],
                         'authors': row['authors'],
                     }})

df_slim = pd.DataFrame(out_slim)
df_full = pd.DataFrame(out_full)

cols = [f'{key}|{int(value)}'
        for key, label in LABELS.items()
        for value in label['values'].keys()]
cols += ['publication_year', 'idx']

df_slim[cols] = df_slim[cols].astype("Int64")
df_full[cols] = df_full[cols].astype("Int64")
