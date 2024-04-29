import toml
import datetime

from backend.server.types import DatasetInfoFull, SchemeLabel, SchemeGroup

groups = {
    'tech': SchemeGroup(name='CDR technology', key='tech', type='single',
                        labels=['tech|0', 'tech|1', 'tech|2', 'tech|3', 'tech|4', 'tech|5', 'tech|6', 'tech|7',
                                'tech|8', 'tech|9', 'tech|10', 'tech|11', 'tech|12', 'tech|13', 'tech|14', 'tech|15',
                                'tech|16']),
    'meth': SchemeGroup(name='Scientific method', key='meth', type='single',
                        labels=['meth|0', 'meth|1', 'meth|2', 'meth|3', 'meth|4', 'meth|5', 'meth|6', 'meth|7',
                                'meth|8', 'meth|9']),
    'cont': SchemeGroup(name='Main focus of study', key='cont', type='single',
                        labels=['cont|0', 'cont|1', 'cont|2', 'cont|3', 'cont|4', 'cont|5']),
}

labels = {
    'tech|0': SchemeLabel(key='tech|0', name='CCS', value=0, colour=(5.54, 74.80, 48.24)),
    'tech|1': SchemeLabel(key='tech|1', name='BECCS', value=1, colour=(27.53, 97.33, 70.59)),
    'tech|2': SchemeLabel(key='tech|2', name='DAC(CS)', value=2, colour=(19.91, 89.30, 47.65)),
    'tech|3': SchemeLabel(key='tech|3', name='CCUS', value=3, colour=(19.14, 96.45, 66.86)),
    'tech|4': SchemeLabel(key='tech|4', name='Soil Carbon Sequestration', value=4, colour=(144.22, 100.00, 21.37)),
    'tech|5': SchemeLabel(key='tech|5', name='Afforestation/Reforestation', value=5, colour=(138.42, 53.77, 41.57)),
    'tech|6': SchemeLabel(key='tech|6', name='Restoration of landscapes/peats', value=6, colour=(121.50, 40.40, 61.18)),
    'tech|7': SchemeLabel(key='tech|7', name='Agroforestry', value=7, colour=(111.43, 47.57, 79.80)),
    'tech|8': SchemeLabel(key='tech|8', name='Forest Management', value=8, colour=(104.51, 51.72, 94.31)),
    'tech|9': SchemeLabel(key='tech|9', name='Biochar', value=9, colour=(336.08, 89.94, 68.82)),
    'tech|10': SchemeLabel(key='tech|10', name='Enhanced weathering (land based)', value=10,
                           colour=(302.26, 32.92, 68.43)),
    'tech|11': SchemeLabel(key='tech|11', name='Ocean alkalinity enhancement', value=11, colour=(262.50, 30.77, 94.90)),
    'tech|12': SchemeLabel(key='tech|12', name='Blue carbon', value=12, colour=(220.00, 37.50, 81.18)),
    'tech|13': SchemeLabel(key='tech|13', name='Algae farming', value=13, colour=(143.33, 17.31, 59.22)),
    'tech|14': SchemeLabel(key='tech|14', name='Ocean fertilization & Artificial upwelling', value=14,
                           colour=(202.46, 94.48, 35.49)),
    'tech|15': SchemeLabel(key='tech|15', name='General Literature on CDR', value=15, colour=(0.00, 0.00, 38.82)),
    'tech|16': SchemeLabel(key='tech|16', name='Other technologies', value=16, colour=(0.00, 0.00, 74.12)),
    'meth|0': SchemeLabel(key='meth|0', name='Experimental - fieldstudy', value=0, colour=(213.96, 42.40, 75.49)),
    'meth|1': SchemeLabel(key='meth|1', name='Experimental - laboratory', value=1, colour=(184.32, 69.06, 35.49)),
    'meth|2': SchemeLabel(key='meth|2', name='Modelling', value=2, colour=(338.33, 100.00, 92.94)),
    'meth|3': SchemeLabel(key='meth|3', name='Data analysis / statistical analysis / econometrics', value=3,
                          colour=(25.18, 97.97, 61.37)),
    'meth|4': SchemeLabel(key='meth|4', name='Life cycle assessment', value=4, colour=(19.44, 99.08, 42.75)),
    'meth|5': SchemeLabel(key='meth|5', name='Review', value=5, colour=(19.29, 93.33, 94.12)),
    'meth|6': SchemeLabel(key='meth|6', name='Systematic review', value=6, colour=(355.77, 89.87, 84.51)),
    'meth|7': SchemeLabel(key='meth|7', name='Survey', value=7, colour=(336.08, 89.94, 68.82)),
    'meth|8': SchemeLabel(key='meth|8', name='Qualitative research', value=8, colour=(316.65, 98.86, 34.31)),
    'meth|9': SchemeLabel(key='meth|9', name='Unknown method', value=9, colour=(0.00, 0.00, 80.00)),
    'cont|0': SchemeLabel(key='cont|0', name='Earth system', value=0, colour=(359.40, 79.45, 49.61)),
    'cont|1': SchemeLabel(key='cont|1', name='Equity and ethics', value=1, colour=(0.61, 92.45, 79.22)),
    'cont|2': SchemeLabel(key='cont|2', name='Policy/government', value=2, colour=(116.38, 56.86, 40.00)),
    'cont|3': SchemeLabel(key='cont|3', name='Public perception', value=3, colour=(91.76, 57.05, 70.78)),
    'cont|4': SchemeLabel(key='cont|4', name='Socio-economic pathways', value=4, colour=(204.16, 70.62, 41.37)),
    'cont|5': SchemeLabel(key='cont|5', name='Technology', value=5, colour=(200.66, 52.14, 77.06)),
}
info = DatasetInfoFull(
    name='CDR Literature Map',
    teaser='Literature on Carbon Dioxide Removal (CDR) used in the State of CDR Report (2024) and <i>Lück et al., 2024</i>\n',
    authors=['Sarah Lück', 'Max Callaghan', 'Malgorzata Borchers', 'Annette Cowie', 'Sabine Fuss', 'Oliver Geden',
             'Matthew Gidden', 'Jens Hartmann', 'Claudia Kammann', 'David P. Keller', 'Florian Kraxner',
             'William Lamb', 'Niall Mac Dowell', 'Finn Müller-Hansen', 'Gregory Nemet', 'Benedict Probst',
             'Phil Renforth', 'Tim Repke', 'Wilfried Rickels', 'Ingrid Schulte', 'Pete Smith', 'Stephen M Smith',
             'Daniela Thrän', 'Tiffany G. Troxler', 'Volker Sick', 'Mijndert van der Spek', 'Jan C. Minx'],
    start_year=1990,
    end_year=2023,
    default_colour='tech',
    created_date=datetime.date(2023, 12, 28),
    last_update=datetime.date(2024, 4, 1),
    db_filename='documents.sqlite',
    arrow_filename='slim.arrow',
    keywords_filename='keywords.arrow',
    slim_geo_filename='geocodes.minimal.arrow',
    full_geo_filename='geocodes.full.arrow',
    figure='teaser.jpg',
    contact=['repke@mcc-berlin.net'],
    groups=groups,
    labels=labels
)

if __name__ == '__main__':
    print('writing info')
    with open('.data/cdrmap/info.toml', 'w') as f:
        # f.write(info.model_dump_json(indent=2))
        toml.dump(info.dict(), f)
