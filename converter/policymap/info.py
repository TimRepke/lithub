import toml
import datetime

from backend.server.types import DatasetInfoFull, SchemeLabel, SchemeGroup

groups = {
    'ins': SchemeGroup(name='Policy instrument', key='ins', type='single',
                       labels=['ins|0', 'ins|1', 'ins|2', 'ins|3', 'ins|4']),
    'econ': SchemeGroup(name='Economic instrument', key='econ', type='single',
                        labels=['econ|0', 'econ|1', 'econ|2', 'econ|3']),
    'reg': SchemeGroup(name='Regulatory instrument', key='reg', type='single', labels=['reg|0', 'reg|1', 'reg|2']),
    'edu': SchemeGroup(name='Information, education and training', key='edu', type='single', labels=['edu|0']),
    'gov': SchemeGroup(name='Governance', key='gov', type='single', labels=['gov|0', 'gov|1', 'gov|2']),
    'sec': SchemeGroup(name='Sector', key='sec', type='single',
                       labels=['sec|0', 'sec|1', 'sec|2', 'sec|3', 'sec|4', 'sec|5', 'sec|6']),
    'meth': SchemeGroup(name='Method', key='meth', type='single', labels=['meth|0', 'meth|1']),
    'lvl': SchemeGroup(name='Implementation level', key='lvl', type='single', labels=['lvl|0', 'lvl|1', 'lvl|2']),
    'ev': SchemeGroup(name='Evidence type', key='ev', type='single', labels=['ev|0', 'ev|1']),
}
labels = {
    'ins|0': SchemeLabel(key='ins|0', name='Economic', value=0, colour=(350.93, 63.24, 26.67)),
    'ins|1': SchemeLabel(key='ins|1', name='Regulatory', value=1, colour=(117.05, 38.85, 69.22)),
    'ins|2': SchemeLabel(key='ins|2', name='Information, education and training', value=2,
                         colour=(200.00, 59.52, 50.59)),
    'ins|3': SchemeLabel(key='ins|3', name='Governance, strategies and targets', value=3,
                         colour=(290.53, 30.65, 48.63)),
    'ins|4': SchemeLabel(key='ins|4', name='Agreements', value=4, colour=(143.33, 17.31, 59.22)),
    'econ|0': SchemeLabel(key='econ|0', name='Carbon pricing', value=0, colour=(350.93, 63.24, 26.67)),
    'econ|1': SchemeLabel(key='econ|1', name='Subsidies', value=1, colour=(350.93, 72.27, 53.33)),
    'econ|2': SchemeLabel(key='econ|2', name='Non-carbon taxes', value=2, colour=(16.91, 87.13, 66.47)),
    'econ|3': SchemeLabel(key='econ|3', name='Direct Investment / spending', value=3, colour=(49.93, 90.73, 70.39)),
    'reg|0': SchemeLabel(key='reg|0', name='Quotas', value=0, colour=(117.05, 38.85, 69.22)),
    'reg|1': SchemeLabel(key='reg|1', name='Spatial and land-use planning', value=1, colour=(49.93, 90.73, 70.39)),
    'reg|2': SchemeLabel(key='reg|2', name='Standards', value=2, colour=(16.91, 87.13, 66.47)),
    'edu|0': SchemeLabel(key='edu|0',
                         name='Standardized labels, reporting and accounting standards and certification schemes',
                         value=0, colour=(143.33, 17.31, 59.22)),
    'gov|0': SchemeLabel(key='gov|0', name='Planning', value=0, colour=(290.53, 30.65, 48.63)),
    'gov|1': SchemeLabel(key='gov|1', name='Government administration & management', value=1,
                         colour=(200.00, 59.52, 50.59)),
    'gov|2': SchemeLabel(key='gov|2', name='Institutions', value=2, colour=(117.05, 38.85, 69.22)),
    'sec|0': SchemeLabel(key='sec|0', name='AFOLU', value=0, colour=(350.93, 63.24, 26.67)),
    'sec|1': SchemeLabel(key='sec|1', name='Buildings', value=1, colour=(350.93, 72.27, 53.33)),
    'sec|2': SchemeLabel(key='sec|2', name='Industry', value=2, colour=(16.91, 87.13, 66.47)),
    'sec|3': SchemeLabel(key='sec|3', name='Energy', value=3, colour=(49.93, 90.73, 70.39)),
    'sec|4': SchemeLabel(key='sec|4', name='Transport', value=4, colour=(117.05, 38.85, 69.22)),
    'sec|5': SchemeLabel(key='sec|5', name='Waste', value=5, colour=(200.00, 59.52, 50.59)),
    'sec|6': SchemeLabel(key='sec|6', name='Cross-sectoral', value=6, colour=(290.53, 30.65, 48.63)),
    'meth|0': SchemeLabel(key='meth|0', name='Quantitative', value=0, colour=(350.93, 63.24, 26.67)),
    'meth|1': SchemeLabel(key='meth|1', name='Qualitative', value=1, colour=(350.93, 72.27, 53.33)),
    'lvl|0': SchemeLabel(key='lvl|0', name='Supranational and international', value=0, colour=(350.93, 63.24, 26.67)),
    'lvl|1': SchemeLabel(key='lvl|1', name='National', value=1, colour=(350.93, 72.27, 53.33)),
    'lvl|2': SchemeLabel(key='lvl|2', name='Sub-national', value=2, colour=(16.91, 87.13, 66.47)),
    'ev|0': SchemeLabel(key='ev|0', name='Ex-post', value=0, colour=(143.33, 17.31, 59.22)),
    'ev|1': SchemeLabel(key='ev|1', name='Ex-ante', value=1, colour=(290.53, 30.65, 48.63)),
}
info = DatasetInfoFull(
    name='Climate Policy Instruments',
    teaser='Literature on climate policy instruments based on paper by <i>Callaghan et al, 2024</i>',
    authors=['Max Callaghan', 'Lucy Banisch', 'Niklas Doebbeling-Hildebrandt', 'Duncan Edmondson',
             'Christian Flachsland', 'William Lamb', 'Sebastian Levi', 'Finn Müller-Hansen', 'Eduardo Posada',
             'Shraddha Vasudevan', 'Jan Minx'],
    start_year=1990,
    end_year=2024,
    default_colour='sec',
    created_date=datetime.date(2023, 12, 28),
    last_update=datetime.date(2024, 4, 1),
    db_filename='policies.sqlite',
    arrow_filename='policies.min.arrow',
    keywords_filename='policies.keywords.arrow',
    slim_geo_filename='geocodes.minimal.arrow',
    full_geo_filename='geocodes.full.arrow',
    figure='teaser.jpg',
    contact=['repke@mcc-berlin.net'],
    groups=groups,
    labels=labels
)

if __name__ == '__main__':
    print('writing info')
    with open('.data/policymap/info.toml', 'w') as f:
        # f.write(info.model_dump_json(indent=2))
        toml.dump(info.dict(), f)
