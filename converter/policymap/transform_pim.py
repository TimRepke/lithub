import math
from pathlib import Path
import pandas as pd
import numpy as np
import openTSNE
from sklearn.feature_extraction.text import TfidfVectorizer
import pyarrow as pa
from sqlalchemy import create_engine, text

print('Reading original data...')
df = pd.read_csv('../.data/policymap/raw/climate_policy_papers.csv')
df = df.replace({np.nan: None})

CHUNK_SIZE = 10000
VECTORS = Path('../.data/policymap/raw/policies.vectors.npy')
OUT_SLIM = Path('../.data/policymap/policies.min.arrow')
OUT_FULL = Path('../.data/policymap/raw/policies.full.arrow')
OUT_SQL = '../.data/policymap/policies.sqlite'
GEOJSON = Path('../.data/policymap/raw/policies.geojson')

MAP = {
    '4 - 1. Economic instruments': ('Policy instrument', 'ins', 0, 'Economic'),
    '4 - 2. Regulatory Instruments': ('Policy instrument', 'ins', 1, 'Regulatory'),
    '4 - 3. Information, education and training': (
        'Policy instrument', 'ins', 2, 'Information, education and training'),
    '4 - 4. Governance, strategies and targets': ('Policy instrument', 'ins', 3, 'Governance, strategies and targets'),
    '4 - 5. Agreements': ('Policy instrument', 'ins', 4, 'Agreements'),

    '5 - 1.02. Carbon pricing': ('Economic instrument', 'econ', 0, 'Carbon pricing'),
    '5 - 1.02. Subsidies': ('Economic instrument', 'econ', 1, 'Subsidies'),
    '5 - 1.03. Non-carbon taxes': ('Economic instrument', 'econ', 2, 'Non-carbon taxes'),
    '5 - 1.04. Direct Investment / spending': ('Economic instrument', 'econ', 3, 'Direct Investment / spending'),

    '5 - 2.06. Quotas': ('Regulatory instrument', 'reg', 0, 'Quotas'),
    '5 - 2.09. Spatial and land-use planning': ('Regulatory instrument', 'reg', 1, 'Spatial and land-use planning'),
    '5 - 2.11. Standards': ('Regulatory instrument', 'reg', 2, 'Standards'),

    '5 - 3.15. Standardized labels, reporting and accounting standards and certification schemes': (
        'Information, education and training', 'edu', 0,
        'Standardized labels, reporting and accounting standards and certification schemes'
    ),

    '5 - 4.17. Planning': ('Governance', 'gov', 0, 'Planning'),
    '5 - 4.18. Government administration & management': (
        'Governance', 'gov', 1, 'Government administration & management'),
    '5 - 4.19. Institutions': ('Governance', 'gov', 2, 'Institutions'),

    # '5 - 5.20. Inter/transnational agreements': ('Agreements', 'agr', 0, 'Inter/transnational agreements'),
    # '5 - 5.21. Inter/transnational agreements': ('Agreements', 'agr', 0, 'Inter/transnational agreements'),

    '8 - 01. AFOLU': ('Sector', 'sec', 0, 'AFOLU'),
    '8 - 02. Buildings': ('Sector', 'sec', 1, 'Buildings'),
    '8 - 03. Industry': ('Sector', 'sec', 2, 'Industry'),
    '8 - 04. Energy': ('Sector', 'sec', 3, 'Energy'),
    '8 - 05. Transport': ('Sector', 'sec', 4, 'Transport'),
    '8 - 06. Waste': ('Sector', 'sec', 5, 'Waste'),
    '8 - 15. Cross-sectoral': ('Sector', 'sec', 6, 'Cross-sectoral'),

    '10 - 3. Quantitative': ('Method', 'meth', 0, 'Quantitative'),
    '10 - 4. Qualitative': ('Method', 'meth', 1, 'Qualitative'),

    '17 - 0. Supranational and international': ('Implementation level', 'lvl', 0, 'Supranational and international'),
    '17 - 1. National': ('Implementation level', 'lvl', 1, 'National'),
    '17 - 2. Sub-national': ('Implementation level', 'lvl', 2, 'Sub-national'),

    '19 - 0. Ex-post': ('Evidence type', 'ev', 0, 'Ex-post'),
    '19 - 1. Ex-ante': ('Evidence type', 'ev', 1, 'Ex-ante')
}

LABELS = {
    'ins': {'name': 'Policy instrument',
            'type': 'single',
            'values': {0: 'Economic', 1: 'Regulatory', 2: 'Information, education and training',
                       3: 'Governance, strategies and targets', 4: 'Agreements'}},
    'econ': {'name': 'Economic instrument',
             'type': 'single',
             'values': {0: 'Carbon pricing', 1: 'Subsidies', 2: 'Non-carbon taxes',
                        3: 'Direct Investment / spending'}},
    'reg': {'name': 'Regulatory instrument',
            'type': 'single',
            'values': {0: 'Quotas', 1: 'Spatial and land-use planning', 2: 'Standards'}},
    'edu': {'name': 'Information, education and training',
            'type': 'single',
            'values': {0: 'Standardized labels, reporting and accounting standards and certification schemes'}},
    'gov': {'name': 'Governance',
            'type': 'single',
            'values': {0: 'Planning', 1: 'Government administration & management', 2: 'Institutions'}},
    'sec': {'name': 'Sector',
            'type': 'single',
            'values': {0: 'AFOLU', 1: 'Buildings', 2: 'Industry', 3: 'Energy', 4: 'Transport', 5: 'Waste',
                       6: 'Cross-sectoral'}},
    'meth': {'name': 'Method',
             'type': 'single',
             'values': {0: 'Quantitative', 1: 'Qualitative'}},
    'lvl': {'name': 'Implementation level',
            'type': 'single',
            'values': {0: 'Supranational and international', 1: 'National', 2: 'Sub-national'}},
    'ev': {'name': 'Evidence type',
           'type': 'single',
           'values': {0: 'Ex-post', 1: 'Ex-ante'}}}

if VECTORS.exists():
    print('Loading existing vectors...')
    with open(VECTORS, 'rb') as f:
        embedding = np.load(f)
else:
    print('Vectorising dataset...')
    vectoriser = TfidfVectorizer(stop_words='english', lowercase=True, min_df=0.01, max_df=0.9, max_features=5000)
    vectors = vectoriser.fit_transform([(r['abstract'] or '') + (r['title'] or '') for _, r in df.iterrows()])
    vectors = vectors.todense()
    vectors = np.asarray(vectors)

    print('Reducing dimensionality...')
    tsne = openTSNE.TSNE(
        perplexity=30,
        metric='euclidean',
        n_jobs=8,
        random_state=42,
        verbose=True,
    )
    embedding = tsne.fit(vectors)

    print('Saving vectors for next time...')
    with open(VECTORS, 'wb') as f:
        np.save(f, embedding)

print('Find projection span...')
maxs = embedding.max(axis=0)
mins = embedding.min(axis=0)
spans = np.sqrt(np.power(mins - maxs, 2))

print('Transforming rows...')
out_slim = []
out_full = []
for idx, ((_, row), vector) in enumerate(zip(df.iterrows(), embedding)):
    out = {
        'idx': idx,
        'x': (((vector[0] - mins[0]) / spans[0]) * 2) - 1,
        'y': (((vector[1] - mins[1]) / spans[1]) * 2) - 1,
        'publication_year': row['publication_year'],
        'incl': row['INCLUDE'],
    }
    out_slim.append(out)

    blank = {
        f'{key}|{int(value)}': None
        for key, label in LABELS.items()
        for value in label['values'].keys()
    }

    for col, (name, k, v, vn) in MAP.items():
        out[f'{k}|{v}'] = row[col]

    out_full.append({
        **blank,
        **out,
        'openalex_id': row['id'],
        'title': row['title'],
        'abstract': row['abstract'],
        'type': row['type'],
        'doi': row['doi'],
        'authors': row['author_name'],
        'institutions': row['institution_name']
    })

print('Preparing dataframes...')
df_full = pd.DataFrame(out_full)
df_slim = pd.DataFrame(out_slim)

df_slim[['publication_year', 'idx']] = df_slim[['publication_year', 'idx']].astype("Int64")
df_full[['publication_year', 'idx']] = df_full[['publication_year', 'idx']].astype("Int64")

df_slim[['x', 'y', 'incl']] = df_slim[['x', 'y', 'incl']].astype("float16")
df_full[['x', 'y', 'incl']] = df_full[['x', 'y', 'incl']].astype("float16")

cols = [f'{key}|{int(value)}'
        for key, label in LABELS.items()
        for value in label['values'].keys()]
df_full[cols] = df_full[cols].astype("float16")

print('Creating sqlite db...')
engine = create_engine(f'sqlite:///{OUT_SQL}', echo=False)
df_full.to_sql(name='documents', con=engine)

print('Indexing data in sqlite...')
con = engine.connect()
# -- Set up search on title, text, authors
con.execute(text('CREATE VIRTUAL TABLE search USING fts5(idx, title, abstract, authors);'))
# -- Indexing data
con.execute(
    text('INSERT INTO search (idx, title, abstract, authors) SELECT idx, title, abstract, authors FROM documents;'))

schema = pa.schema([
    ('idx', pa.uint32()),
    ('x', pa.float16()),
    ('y', pa.float16()),
    ('publication_year', pa.uint16()),
    ('incl', pa.float16())
])
# + [
#     (f'{key}|{int(value)}', pa.bool_())
#     for key, label in LABELS.items()
#     for value in label['values'].keys()
# ]

print(f'Writing {OUT_SLIM}')
with pa.OSFile(str(OUT_SLIM), 'wb') as sink:
    with pa.ipc.new_stream(sink, schema) as writer:
        n_chunks = int(math.ceil(df_slim.shape[0] / CHUNK_SIZE))
        for chunk in range(n_chunks):
            tmp = df_slim[chunk * CHUNK_SIZE:(chunk + 1) * CHUNK_SIZE]
            batch = pa.record_batch(tmp, schema)
            writer.write(batch)
print(f'Wrote {OUT_SLIM}')
