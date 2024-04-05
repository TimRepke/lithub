import json
from pathlib import Path

import pandas as pd
import pyarrow as pa
from converter.iso31661 import lookup
from converter.geonames import FEATURE_LOOKUP

PLACES = Path('../../.data/cdrmap/raw/cdr_places.jsonl')
OUT_CSV = Path('../../.data/cdrmap/raw/cdr_places.csv')
OUT_SLIM = Path('../../.data/cdrmap//geocodes.minimal.arrow')
OUT_FULL = Path('../../.data/cdrmap/raw//geocodes.full.arrow')

keys = set()
values = []

with open(PLACES, 'r') as f:
    for line in f:
        data = json.loads(line)
        for place in data['places']:
            key = f"{data['idx']}|{place['geonameid']}"
            country_num = lookup.get(place['country_code3'])
            if key not in keys and country_num is not None:
                keys.add(key)
                values.append({
                    'id': data['id'],
                    'idx': data['idx'],
                    'geonameid': int(place['geonameid']),
                    'name': place['name'],
                    'country': place['country_code3'],
                    'country_num': country_num,
                    'lat': place['lat'],
                    'lon': place['lon'],
                    'class': place['feature_class'],
                    'code': place['feature_code'],
                    'feature': FEATURE_LOOKUP.get(f"{place['feature_class']}.{place['feature_code'] or ''}")
                })

df = pd.DataFrame(values)
df = df.astype({
    'lat': 'float16',
    'lon': 'float16'
})
df.to_csv(OUT_CSV, index=False)

schema = pa.schema([
    pa.field('idx', pa.uint32()),
    # pa.field('country', pa.string())
    pa.field('country_num', pa.uint16())
])
fa = pa.Table.from_pandas(df=df[schema.names], schema=schema)
with pa.OSFile(str(OUT_SLIM), 'wb') as sink:
    with pa.ipc.new_file(sink, schema=schema) as writer:
        for batch in fa.to_batches(2000):
            # batch_ = pa.record_batch(batch, schema=schema)
            writer.write(batch)

schema = pa.schema([
    pa.field('idx', pa.uint32()),
    pa.field('geonameid', pa.uint32()),  # ~284KB
    pa.field('country_num', pa.uint16()),
    pa.field('lat', pa.float16()),
    pa.field('lon', pa.float16()),
    pa.field('name', pa.string()),  # ~1.5MB
    # pa.field('class', pa.string())  # ~300KB
    # pa.field('code', pa.string())  # ~1.6MB
    pa.field('feature', pa.uint16())  # ~100KB
    # full: 2.6MB
])

fa = pa.Table.from_pandas(df=df[schema.names], schema=schema)
with pa.OSFile(str(OUT_FULL), 'wb') as sink:
    with pa.ipc.new_file(sink, schema=schema) as writer:
        for batch in fa.to_batches(2000):
            # batch_ = pa.record_batch(batch, schema=schema)
            writer.write(batch)

# print(json.dumps(FEATURE_LOOKUP, indent=2))
