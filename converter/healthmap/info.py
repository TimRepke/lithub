import toml
import datetime

import pandas as pd
from backend.server.types import DatasetInfoFull, SchemeLabel, SchemeGroup

BASE_COLOURS = {  # HSL
    'Intervention option': [266.25, 38.55, 67.45],  # A88CCC
    'Exposure': [340.93, 98.17, 78.63],  # FE93B5
    'Mediating pathways': [45.56, 76.06, 72.16],  # EED482
    'Other': [127.88, 90.83, 78.63],  # 97FAA4
    'Health impact': [194.86, 70.32, 69.61],  # 7BCDE8
}

# id,title,top_words,Topic ID,Aggregated meta-topic,Aggregated topic,Topic,color,short_title
df = pd.read_csv('.data/healthmap/raw/topic_info.csv')
c = [
    [None, r['Aggregated meta-topic'], r['Aggregated topic'], r['Topic']]
    for _, r in df.iterrows()
]

labels = {
    'rel|1': SchemeLabel(key='rel|1', name='Relevant', value=1, colour=(16.91, 87.13, 66.47)),

    'cat|0': SchemeLabel(key='cat|0', name='Mitigation', value=0, colour=(350.93, 63.24, 26.67)),
    'cat|1': SchemeLabel(key='cat|1', name='Adaptation', value=1, colour=(290.53, 30.65, 48.63)),
    'cat|2': SchemeLabel(key='cat|2', name='Impacts', value=2, colour=(143.33, 17.31, 59.22)),

    'cont|0': SchemeLabel(key='cont|0', name='North America', value=0, colour=(25.18, 97.97, 61.37)),
    'cont|1': SchemeLabel(key='cont|1', name='South America', value=1, colour=(338.33, 100.0, 92.94)),
    'cont|2': SchemeLabel(key='cont|2', name='Asia', value=2, colour=(184.32, 69.06, 35.49)),
    'cont|3': SchemeLabel(key='cont|3', name='Oceania', value=3, colour=(0.0, 0.0, 38.82)),
    'cont|4': SchemeLabel(key='cont|4', name='Africa', value=4, colour=(202.46, 94.48, 35.49)),
    'cont|5': SchemeLabel(key='cont|5', name='Europe', value=5, colour=(16.91, 87.13, 66.47))
}

groups = {
    'rel': SchemeGroup(name='Relevance', key='rel', type='bool', labels=['rel|1']),
    'cat': SchemeGroup(name='Category', key='cat', type='single', labels=['cat|0', 'cat|1', 'cat|2']),
    'cont': SchemeGroup(name='Continent', key='cont', type='single',
                        labels=['cont|0', 'cont|1', 'cont|2', 'cont|3', 'cont|4', 'cont|5']),
    't3': SchemeGroup(name='Meta-topic', key='t3', type='multi', subgroups=[]),
    't2': SchemeGroup(name='Aggregated topic', key='t2', type='multi', subgroups=[])
}

topics = []  # separately convenience tracker of topic leaf nodes for ease of access
for i2, t2 in enumerate(sorted(set([r[1] for r in c]))):
    # Add child to parent
    meta = SchemeGroup(name=t2, key=f't2-{i2}', type='multi', subgroups=[], colour=BASE_COLOURS[t2])
    groups[meta.key] = meta
    groups['t3'].subgroups.append(meta.key)

    for i1, t1 in enumerate(sorted(set([r[2] for r in c if r[1] == t2]))):
        agg = SchemeGroup(name=t1, key=f't1-{i2}-{i1}', type='multi', labels=[],
                          colour=(meta.colour[0], meta.colour[1], meta.colour[2] + 5))
        groups[agg.key] = agg
        groups[meta.key].subgroups.append(agg.key)
        groups['t2'].subgroups.append(agg.key)

        for i0, t0 in enumerate(sorted(set([r[3] for r in c if r[2] == t1]))):
            lab = SchemeLabel(name=t0, key=f't0-{i2}-{i1}|{i0}', value=i0,
                              colour=(agg.colour[0], agg.colour[1], agg.colour[2] + 5))

            labels[lab.key] = lab
            groups[agg.key].labels.append(lab.key)
            topics.append(lab)

info = DatasetInfoFull(
    name='Climate and Health Map',
    teaser='Explore scientific papers by subject and place of study.',
    authors=[
        'Max Callaghan'
    ],
    contact=['callaghan@mcc-berlin.net'],
    start_year=1990,
    end_year=2024 + 1,
    default_colour='t3',
    created_date=datetime.date(year=2020, month=7, day=13),
    last_update=datetime.date(year=2024, month=4, day=26),
    db_filename='documents.sqlite',
    arrow_filename='slim.arrow',
    keywords_filename='keywords.arrow',
    slim_geo_filename='geocodes.minimal.arrow',
    full_geo_filename='geocodes.full.arrow',
    # https://pixabay.com/photos/forest-trees-autumn-nature-season-6765636/
    # @fietzfotos, pixabay
    figure='teaser.jpg',
    groups=groups,
    labels=labels,
    hidden=True,
)

if __name__ == '__main__':
    print('writing info')
    with open('.data/healthmap/info.toml', 'w') as f:
        # f.write(info.model_dump_json(indent=2))
        toml.dump(info.dict(), f)
