import json
import logging
from pathlib import Path

import typer
import pandas as pd
from tqdm import tqdm
from mordecai3 import Geoparser


def main(in_file: Path, out_file: Path):
    logging.getLogger('elasticsearch').setLevel(logging.WARN)

    df = pd.read_csv(in_file)
    print(df.shape)
    print(df.head())

    geo = Geoparser()

    with open(out_file, 'w') as fout:
        for i, (_, row) in tqdm(enumerate(df.iterrows())):
            try:
                txt = row.get('title', '') + row.get('abstract', '')
                places = geo.geoparse_doc(txt)
                if len(places['geolocated_ents']) > 0:
                    fout.write(json.dumps({
                        'places': places['geolocated_ents'],
                        'idx': i,
                        'id': row['openalex_id']
                    }) + '\n')
            except Exception as e:
                # print(e)
                pass


if __name__ == "__main__":
    print('Ensure mordecai is set up properly:')
    print('  https://apsis.mcc-berlin.net/nacsos-docs/dev/mordecai/')
    typer.run(main)
