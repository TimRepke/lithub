import toml
import datetime
import ast

from backend.server.types import DatasetInfoFull, SchemeLabel, SchemeGroup

# hsl_colors = [
#     (0, 100, 50),     # Red
#     (30, 100, 50),    # Orange
#     (60, 100, 50),    # Yellow
#     (90, 100, 50),    # Chartreuse Green
#     (120, 100, 50),   # Green
#     (150, 100, 50),   # Spring Green
#     (180, 100, 50),   # Cyan
#     (210, 100, 50),   # Azure
#     (240, 100, 50),   # Blue
#     (270, 100, 50),   # Violet
#     (300, 100, 50),   # Magenta
#     (330, 100, 50)    # Rose
# ]

# for ik, (k, v) in enumerate(SCHEME.items()):
#     ls = [f'{k}|{c['value']}' for c in v['choices']]
#     print(f"'{k}': SchemeGroup(key='{k}', name='{v['name']}', type='{v['kind']}', colour={colors[ik]}, desc='{c.get('hint')}', labels={ls}),")
groups = {
    'cp': SchemeGroup(key='cp', name='Carbon pricing', type='single', colour=(0, 100, 50),
                      desc='any other outcomes assessed', labels=['cp|0', 'cp|1', 'cp|2']),
    'imp': SchemeGroup(key='imp', name='Implemented policy', type='single', colour=(30, 100, 50),
                       desc='any other outcomes assessed', labels=['imp|0', 'imp|1', 'imp|2']),
    'exp': SchemeGroup(key='exp', name='ex-post/ex-ante', type='single', colour=(60, 100, 50),
                       desc='any other outcomes assessed', labels=['exp|0', 'exp|1', 'exp|2']),
    'meth': SchemeGroup(key='meth', name='Method', type='single', colour=(90, 100, 50),
                        desc='any other outcomes assessed',
                        labels=['meth|0', 'meth|1', 'meth|2', 'meth|3', 'meth|4', 'meth|5']),
    'outc': SchemeGroup(key='outc', name='Analysed outcome', type='multi', colour=(120, 100, 50),
                        desc='any other outcomes assessed',
                        labels=['outc|0', 'outc|1', 'outc|2', 'outc|3', 'outc|4', 'outc|5', 'outc|6', 'outc|7',
                                'outc|8', 'outc|9', 'outc|10', 'outc|11', 'outc|12', 'outc|13', 'outc|14']),
    'polname': SchemeGroup(key='polname', name='Policy name', type='multi', colour=(150, 100, 50),
                           desc='any other outcomes assessed',
                           labels=['polname|0', 'polname|1', 'polname|2', 'polname|3', 'polname|4', 'polname|5',
                                   'polname|6', 'polname|7', 'polname|8', 'polname|9', 'polname|10', 'polname|11',
                                   'polname|12', 'polname|13', 'polname|14', 'polname|15', 'polname|16', 'polname|17',
                                   'polname|18', 'polname|19', 'polname|20', 'polname|21', 'polname|22', 'polname|23',
                                   'polname|24', 'polname|25', 'polname|26', 'polname|27', 'polname|28', 'polname|29',
                                   'polname|30', 'polname|31', 'polname|32', 'polname|33', 'polname|34', 'polname|35',
                                   'polname|36', 'polname|37', 'polname|38', 'polname|39', 'polname|40', 'polname|41',
                                   'polname|42', 'polname|43', 'polname|44', 'polname|45', 'polname|46', 'polname|47',
                                   'polname|48', 'polname|49', 'polname|50', 'polname|51', 'polname|52', 'polname|53',
                                   'polname|54', 'polname|55', 'polname|56', 'polname|57', 'polname|58', 'polname|59',
                                   'polname|60', 'polname|61', 'polname|62', 'polname|63', 'polname|64', 'polname|65',
                                   'polname|66', 'polname|67', 'polname|68', 'polname|69', 'polname|70', 'polname|71',
                                   'polname|72', 'polname|73']),
    'sect': SchemeGroup(key='sect', name='Sector', type='multi', colour=(180, 100, 50),
                        desc='any other outcomes assessed',
                        labels=['sect|0', 'sect|1', 'sect|2', 'sect|3', 'sect|4', 'sect|5']),
    # TODO policy
}

# for ik, (k, v) in enumerate(SCHEME.items()):
#     try:
#         for ic, c in enumerate(v['choices']):
#             print(f"'{k}|{c['value']}': SchemeLabel(key='{k}|{c['value']}', name='{c['name']}', value={c['value']}, colour={colors[ic%len(colors)]}, desc='{c.get('hint')}'),")
#     except Exception as e:
#         print(e)
labels = {
    'cp|0': SchemeLabel(key='cp|0', name='no', value=0, colour=(0, 100, 50), desc='None'),
    'cp|1': SchemeLabel(key='cp|1', name='yes', value=1, colour=(30, 100, 50), desc='None'),
    'cp|2': SchemeLabel(key='cp|2', name='maybe', value=2, colour=(60, 100, 50),
                        desc='only choose when it is really unclear'),
    'imp|0': SchemeLabel(key='imp|0', name='no', value=0, colour=(0, 100, 50), desc='None'),
    'imp|1': SchemeLabel(key='imp|1', name='yes', value=1, colour=(30, 100, 50), desc='None'),
    'imp|2': SchemeLabel(key='imp|2', name='maybe', value=2, colour=(60, 100, 50),
                         desc='only choose when it is really unclear'),
    'exp|0': SchemeLabel(key='exp|0', name='ex-ante', value=0, colour=(0, 100, 50),
                         desc='the policy is assessed using ex-ante methods, including modelling, theoretical discussions, etc.'),
    'exp|1': SchemeLabel(key='exp|1', name='ex-post', value=1, colour=(30, 100, 50),
                         desc='the policy is assessed using empirical research methods and data gathered after the policy was implemented'),
    'exp|2': SchemeLabel(key='exp|2', name='unclear', value=2, colour=(60, 100, 50),
                         desc='only choose when there is no indication'),
    'meth|0': SchemeLabel(key='meth|0', name='quasi-experiment', value=0, colour=(0, 100, 50),
                          desc='Select, if a particular method for causal inference (DiD, RDD,...) is mentioned.'),
    'meth|1': SchemeLabel(key='meth|1', name='statistical inference', value=1, colour=(30, 100, 50),
                          desc='Select, if statistical method is used, but no causal inference method mentioned.'),
    'meth|2': SchemeLabel(key='meth|2', name='other quantitative', value=2, colour=(60, 100, 50),
                          desc='Select for quantitative studies, without inferential statistics (e.g. decomposition, discriptive statistics). '),
    'meth|3': SchemeLabel(key='meth|3', name='survey/interview', value=3, colour=(90, 100, 50),
                          desc='Select, if data is collected/analysed from surveys/interviews. '),
    'meth|4': SchemeLabel(key='meth|4', name='review', value=4, colour=(120, 100, 50),
                          desc='Select, if a study reviews ex-post evidence.'),
    'meth|5': SchemeLabel(key='meth|5', name='other', value=5, colour=(150, 100, 50),
                          desc='Select, if another method is used or the method is unclear.'),
    'outc|0': SchemeLabel(key='outc|0', name='Environmental effectiveness', value=0, colour=(0, 100, 50),
                          desc='effect on emissions or energy use'),
    'outc|1': SchemeLabel(key='outc|1', name='Leakage', value=1, colour=(30, 100, 50),
                          desc='Emissions or production processes relocated to other geographies or actors not covered by the carbon price'),
    'outc|2': SchemeLabel(key='outc|2', name='Innovation & Investment', value=2, colour=(60, 100, 50),
                          desc='effect on research, development, demonstration, investment'),
    'outc|3': SchemeLabel(key='outc|3', name='Firm behaviour & Economic structure', value=3, colour=(90, 100, 50),
                          desc='effect e.g. on capacity of energy installations, use of technologies, firm behaviour, supply of goods'),
    'outc|4': SchemeLabel(key='outc|4', name='Prices of goods & services', value=4, colour=(120, 100, 50),
                          desc='effect on all prices except for carbon (allowance) price'),
    'outc|5': SchemeLabel(key='outc|5', name='Household behaviour', value=5, colour=(150, 100, 50),
                          desc='effect on behaviour of individuals (not firms or government)'),
    'outc|6': SchemeLabel(key='outc|6', name='Competitiveness', value=6, colour=(180, 100, 50),
                          desc='effect on GDP or firm value'),
    'outc|7': SchemeLabel(key='outc|7', name='Employment & Labour market', value=7, colour=(210, 100, 50),
                          desc='effect on employment or labour market'),
    'outc|8': SchemeLabel(key='outc|8', name='Distribution & Fairness', value=8, colour=(240, 100, 50),
                          desc='distributional and other social outcomes'),
    'outc|9': SchemeLabel(key='outc|9', name='Cost effectiveness & Efficiency', value=9, colour=(270, 100, 50),
                          desc='evaluation of the cost effectiveness/efficiency of the policy'),
    'outc|10': SchemeLabel(key='outc|10', name='Implementation process & feasibility', value=10, colour=(300, 100, 50),
                           desc='e.g. carbon price developments, carbon price expectations, compliance, distribution of allowances, use of off-sets, banking of allowances, administration, political economy'),
    'outc|11': SchemeLabel(key='outc|11', name='(Public) Perception', value=11, colour=(330, 100, 50),
                           desc='Perception of the policy in the general public or groups of people'),
    'outc|12': SchemeLabel(key='outc|12', name='other', value=12, colour=(0, 100, 50),
                           desc='any other outcomes assessed'),
    'outc|13': SchemeLabel(key='outc|13', name='unknown', value=13, colour=(30, 100, 50),
                           desc='select, if no information is provided, what outcomes are assessed'),
    'outc|14': SchemeLabel(key='outc|14', name='environmental or health co-benefits', value=14, colour=(60, 100, 50),
                           desc='None'),
    'polname|0': SchemeLabel(key='polname|0', name='multiple', value=0, colour=(0, 100, 50),
                             desc='Select, if the study analyses multiple policies, not further specified in the abstract.'),
    'polname|1': SchemeLabel(key='polname|1', name='unclear', value=1, colour=(30, 100, 50),
                             desc='Select, if it is not clear from the abstract, which policy is assessed.'),
    'polname|2': SchemeLabel(key='polname|2', name='other', value=2, colour=(60, 100, 50),
                             desc='Select, if the assessed policy is not in the list below.'),
    'polname|3': SchemeLabel(key='polname|3', name='China national ETS', value=3, colour=(90, 100, 50),
                             desc='implemented in 2021'),
    'polname|4': SchemeLabel(key='polname|4', name='China regional ETS pilots', value=4, colour=(120, 100, 50),
                             desc='Select, if not further specified, which pilot(s) is assessed.'),
    'polname|5': SchemeLabel(key='polname|5', name='EU ETS', value=5, colour=(150, 100, 50), desc='None'),
    'polname|6': SchemeLabel(key='polname|6', name='British Columbia carbon tax', value=6, colour=(180, 100, 50),
                             desc='None'),
    'polname|7': SchemeLabel(key='polname|7', name='California ETS', value=7, colour=(210, 100, 50), desc='None'),
    'polname|8': SchemeLabel(key='polname|8', name='Quebec ETS', value=8, colour=(240, 100, 50), desc='None'),
    'polname|9': SchemeLabel(key='polname|9', name='RGGI', value=9, colour=(270, 100, 50),
                             desc='Regional Greenhouse Gas Initiative (some US States)'),
    'polname|10': SchemeLabel(key='polname|10', name='Alberta ETS', value=10, colour=(300, 100, 50), desc='None'),
    'polname|11': SchemeLabel(key='polname|11', name='Argentina carbon tax', value=11, colour=(330, 100, 50),
                              desc='implemented 2018'),
    'polname|12': SchemeLabel(key='polname|12', name='Austria ETS', value=12, colour=(0, 100, 50),
                              desc='implemented 2022'),
    'polname|13': SchemeLabel(key='polname|13', name='Baja California carbon tax', value=13, colour=(30, 100, 50),
                              desc='Mexican state, implemented 2020'),
    'polname|14': SchemeLabel(key='polname|14', name='Beijing pilot ETS', value=14, colour=(60, 100, 50), desc='None'),
    'polname|15': SchemeLabel(key='polname|15', name='Canada federal carbon tax', value=15, colour=(90, 100, 50),
                              desc='implemented 2019'),
    'polname|16': SchemeLabel(key='polname|16', name='Canada federal ETS', value=16, colour=(120, 100, 50),
                              desc='implemented 2019'),
    'polname|17': SchemeLabel(key='polname|17', name='Chile carbon tax', value=17, colour=(150, 100, 50),
                              desc='implemented 2017'),
    'polname|18': SchemeLabel(key='polname|18', name='Chongqing pilot ETS', value=18, colour=(180, 100, 50),
                              desc='None'),
    'polname|19': SchemeLabel(key='polname|19', name='Colombia carbon tax', value=19, colour=(210, 100, 50),
                              desc='implemented 2017'),
    'polname|20': SchemeLabel(key='polname|20', name='Denmark carbon tax', value=20, colour=(240, 100, 50),
                              desc='implemented 1992'),
    'polname|21': SchemeLabel(key='polname|21', name='Estonia carbon tax', value=21, colour=(270, 100, 50),
                              desc='implemented 2000'),
    'polname|22': SchemeLabel(key='polname|22', name='Finland carbon tax', value=22, colour=(300, 100, 50),
                              desc='implemented 1990'),
    'polname|23': SchemeLabel(key='polname|23', name='France carbon tax', value=23, colour=(330, 100, 50),
                              desc='implemented 2014'),
    'polname|24': SchemeLabel(key='polname|24', name='Fujian pilot ETS', value=24, colour=(0, 100, 50), desc='None'),
    'polname|25': SchemeLabel(key='polname|25', name='Germany ETS', value=25, colour=(30, 100, 50),
                              desc='implemented 2021 (sometimes considered carbon tax)'),
    'polname|26': SchemeLabel(key='polname|26', name='Guangdong pilot ETS', value=26, colour=(60, 100, 50),
                              desc='None'),
    'polname|27': SchemeLabel(key='polname|27', name='Hubei pilot ETS', value=27, colour=(90, 100, 50), desc='None'),
    'polname|28': SchemeLabel(key='polname|28', name='Iceland carbon tax', value=28, colour=(120, 100, 50),
                              desc='None'),
    'polname|29': SchemeLabel(key='polname|29', name='Indonesia carbon tax', value=29, colour=(150, 100, 50),
                              desc='implemented 2022'),
    'polname|30': SchemeLabel(key='polname|30', name='Ireland carbon tax', value=30, colour=(180, 100, 50),
                              desc='implemented 2010'),
    'polname|31': SchemeLabel(key='polname|31', name='Japan carbon tax', value=31, colour=(210, 100, 50),
                              desc='implemented 2012'),
    'polname|32': SchemeLabel(key='polname|32', name='Kazakhstan ETS', value=32, colour=(240, 100, 50), desc='None'),
    'polname|33': SchemeLabel(key='polname|33', name='Korea ETS', value=33, colour=(270, 100, 50), desc='None'),
    'polname|34': SchemeLabel(key='polname|34', name='Latvia carbon tax', value=34, colour=(300, 100, 50), desc='None'),
    'polname|35': SchemeLabel(key='polname|35', name='Lichtenstein carbon tax', value=35, colour=(330, 100, 50),
                              desc='None'),
    'polname|36': SchemeLabel(key='polname|36', name='Luxembourg carbon tax', value=36, colour=(0, 100, 50),
                              desc='None'),
    'polname|37': SchemeLabel(key='polname|37', name='Massachusetts ETS', value=37, colour=(30, 100, 50), desc='None'),
    'polname|38': SchemeLabel(key='polname|38', name='Mexico carbon tax', value=38, colour=(60, 100, 50), desc='None'),
    'polname|39': SchemeLabel(key='polname|39', name='Mexico ETS', value=39, colour=(90, 100, 50), desc='None'),
    'polname|40': SchemeLabel(key='polname|40', name='Netherlands carbon tax', value=40, colour=(120, 100, 50),
                              desc='None'),
    'polname|41': SchemeLabel(key='polname|41', name='New Brunswick carbon tax', value=41, colour=(150, 100, 50),
                              desc='None'),
    'polname|42': SchemeLabel(key='polname|42', name='New Brunswick ETS', value=42, colour=(180, 100, 50), desc='None'),
    'polname|43': SchemeLabel(key='polname|43', name='New Zealand ETS', value=43, colour=(210, 100, 50), desc='None'),
    'polname|44': SchemeLabel(key='polname|44', name='Newfoundland and Labrador carbon tax', value=44,
                              colour=(240, 100, 50), desc='None'),
    'polname|45': SchemeLabel(key='polname|45', name='Newfoundland and Labrador ETS', value=45, colour=(270, 100, 50),
                              desc='None'),
    'polname|46': SchemeLabel(key='polname|46', name='Northwest Territories carbon tax', value=46,
                              colour=(300, 100, 50), desc='None'),
    'polname|47': SchemeLabel(key='polname|47', name='Norway carbon tax', value=47, colour=(330, 100, 50), desc='None'),
    'polname|48': SchemeLabel(key='polname|48', name='Nova Scotia ETS', value=48, colour=(0, 100, 50), desc='None'),
    'polname|49': SchemeLabel(key='polname|49', name='Ontario ETS', value=49, colour=(30, 100, 50), desc='None'),
    'polname|50': SchemeLabel(key='polname|50', name='Oregon ETS', value=50, colour=(60, 100, 50), desc='None'),
    'polname|51': SchemeLabel(key='polname|51', name='Poland carbon tax', value=51, colour=(90, 100, 50), desc='None'),
    'polname|52': SchemeLabel(key='polname|52', name='Portugal carbon tax', value=52, colour=(120, 100, 50),
                              desc='None'),
    'polname|53': SchemeLabel(key='polname|53', name='Prince Edward Island carbon tax', value=53, colour=(150, 100, 50),
                              desc='None'),
    'polname|54': SchemeLabel(key='polname|54', name='Saitama ETS', value=54, colour=(180, 100, 50), desc='None'),
    'polname|55': SchemeLabel(key='polname|55', name='Saskatchewan ETS', value=55, colour=(210, 100, 50), desc='None'),
    'polname|56': SchemeLabel(key='polname|56', name='Shanghai pilot ETS', value=56, colour=(240, 100, 50),
                              desc='None'),
    'polname|57': SchemeLabel(key='polname|57', name='Shenzhen pilot ETS', value=57, colour=(270, 100, 50),
                              desc='None'),
    'polname|58': SchemeLabel(key='polname|58', name='Singapore carbon tax', value=58, colour=(300, 100, 50),
                              desc='None'),
    'polname|59': SchemeLabel(key='polname|59', name='Slovenia carbon tax', value=59, colour=(330, 100, 50),
                              desc='None'),
    'polname|60': SchemeLabel(key='polname|60', name='South Africa carbon tax', value=60, colour=(0, 100, 50),
                              desc='None'),
    'polname|61': SchemeLabel(key='polname|61', name='Spain carbon tax', value=61, colour=(30, 100, 50), desc='None'),
    'polname|62': SchemeLabel(key='polname|62', name='Sweden carbon tax', value=62, colour=(60, 100, 50), desc='None'),
    'polname|63': SchemeLabel(key='polname|63', name='Switzerland carbon tax', value=63, colour=(90, 100, 50),
                              desc='None'),
    'polname|64': SchemeLabel(key='polname|64', name='Switzerland ETS', value=64, colour=(120, 100, 50), desc='None'),
    'polname|65': SchemeLabel(key='polname|65', name='Tamaulipas carbon tax', value=65, colour=(150, 100, 50),
                              desc='None'),
    'polname|66': SchemeLabel(key='polname|66', name='Tianjin pilot ETS', value=66, colour=(180, 100, 50), desc='None'),
    'polname|67': SchemeLabel(key='polname|67', name='Tokyo ETS', value=67, colour=(210, 100, 50), desc='None'),
    'polname|68': SchemeLabel(key='polname|68', name='UK carbon price support', value=68, colour=(240, 100, 50),
                              desc='None'),
    'polname|69': SchemeLabel(key='polname|69', name='UK ETS', value=69, colour=(270, 100, 50),
                              desc='implemented 2021'),
    'polname|70': SchemeLabel(key='polname|70', name='Ukraine carbon tax', value=70, colour=(300, 100, 50),
                              desc='None'),
    'polname|71': SchemeLabel(key='polname|71', name='Uruguay carbon tax', value=71, colour=(330, 100, 50),
                              desc='None'),
    'polname|72': SchemeLabel(key='polname|72', name='Zacatecas carbon tax', value=72, colour=(0, 100, 50),
                              desc='None'),
    'polname|73': SchemeLabel(key='polname|73', name='Australia ETS', value=73, colour=(30, 100, 50),
                              desc='in force 2012-2014'),
    'sect|0': SchemeLabel(key='sect|0', name='Energy', value=0, colour=(0, 100, 50), desc='Energy sector'),
    'sect|1': SchemeLabel(key='sect|1', name='Industry', value=1, colour=(30, 100, 50), desc='Industry and waste'),
    'sect|2': SchemeLabel(key='sect|2', name='Transport', value=2, colour=(60, 100, 50), desc='Transport sector'),
    'sect|3': SchemeLabel(key='sect|3', name='Buildings', value=3, colour=(90, 100, 50),
                          desc='direct energy use in buildings (e.g. heating, cooking fuels)'),
    'sect|4': SchemeLabel(key='sect|4', name='AFOLU', value=4, colour=(120, 100, 50),
                          desc='Agriculture, forestry and other land use change'),
    'sect|5': SchemeLabel(key='sect|5', name='Aviation and shipping', value=5, colour=(150, 100, 50), desc='None'),
}
info = DatasetInfoFull(
    name='Carbon pricing map',
    teaser='Literature on carbon pricing based on paper by <i>Döbbeling et al, 2024</i>',
    authors=['Niklas Döbbeling', 'Tim Repke'],
    start_year=1990,
    end_year=2023,
    default_colour='outc',
    created_date=datetime.date(2024, 5, 28),
    last_update=datetime.date(2024, 6, 3),
    db_filename='data.sqlite',
    arrow_filename='layout.arrow',
    keywords_filename='keywords.arrow',
    # slim_geo_filename='geocodes.minimal.arrow',
    # full_geo_filename='geocodes.full.arrow',
    figure='teaser.jpg',
    contact=['repke@mcc-berlin.net'],
    groups=groups,
    labels=labels,
    hidden=True
)

if __name__ == '__main__':
    print('writing info')
    with open('.data/carbonpricing/info.toml', 'w') as f:
        # f.write(info.model_dump_json(indent=2))
        toml.dump(info.dict(), f)
