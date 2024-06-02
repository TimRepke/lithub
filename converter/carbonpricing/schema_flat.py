SCHEME = {
    'cp': {
        'name': 'Carbon pricing',
        'key': 'cp',
        'hint': 'carbon tax or cap-and-trade scheme',
        'kind': 'single',
        'choices': [
            {'name': 'no', 'value': 0},
            {'name': 'yes', 'value': 1},
            {'name': 'maybe', 'hint': 'only choose when it is really unclear', 'value': 2}
        ],
    },
    'imp': {
        'name': 'Implemented policy',
        'key': 'imp',
        'hint': 'Does the article study the policy after its implementation?',
        'kind': 'single',
        'choices': [
            {'name': 'no', 'value': 0},
            {'name': 'yes', 'value': 1},
            {'name': 'maybe', 'hint': 'only choose when it is really unclear', 'value': 2}
        ]
    },
    'exp': {
        'name': 'ex-post/ex-ante',
        'key': 'exp',
        'kind': 'single',
        'choices': [
            {
                'name': 'ex-ante',
                'hint': 'the policy is assessed using ex-ante methods, including modelling, theoretical discussions, etc.',
                'value': 0
            },
            {
                'name': 'ex-post',
                'hint': 'the policy is assessed using empirical research methods and data gathered after the policy was implemented',
                'value': 1,
            },
            {
                'name': 'unclear',
                'hint': 'only choose when there is no indication',
                'value': 2,
            }
        ],
    },
    'meth': {
        'name': 'Method',
        'key': 'meth',
        'kind': 'single',
        'choices': [
            {
                'name': 'quasi-experiment',
                'hint': 'Select, if a particular method for causal inference (DiD, RDD,...) is mentioned.',
                'value': 0
            },
            {
                'name': 'statistical inference',
                'hint': 'Select, if statistical method is used, but no causal inference method mentioned.',
                'value': 1
            },
            {
                'name': 'other quantitative',
                'hint': 'Select for quantitative studies, without inferential statistics (e.g. decomposition, discriptive statistics). ',
                'value': 2
            },
            {
                'name': 'survey/interview',
                'hint': 'Select, if data is collected/analysed from surveys/interviews. ',
                'value': 3
            },
            {
                'name': 'review',
                'hint': 'Select, if a study reviews ex-post evidence.',
                'value': 4
            },
            {
                'name': 'other',
                'hint': 'Select, if another method is used or the method is unclear.',
                'value': 5
            }
        ]
    },
    'outc': {
        'name': 'Analysed outcome',
        'key': 'outc',
        'hint': 'What policy outcome (intended or unintended) is analysed in the article? (multiple choices possible)',
        'kind': 'multi',
        'choices': [
            {
                'name': 'Environmental effectiveness',
                'hint': 'effect on emissions or energy use',
                'value': 0
            },
            {
                'name': 'Leakage',
                'hint': 'Emissions or production processes relocated to other geographies or actors not covered by the carbon price',
                'value': 1
            },
            {
                'name': 'Innovation & Investment',
                'hint': 'effect on research, development, demonstration, investment',
                'value': 2
            },
            {
                'name': 'Firm behaviour & Economic structure',
                'hint': 'effect e.g. on capacity of energy installations, use of technologies, firm behaviour, supply of goods',
                'value': 3
            },
            {
                'name': 'Prices of goods & services',
                'hint': 'effect on all prices except for carbon (allowance) price',
                'value': 4
            },
            {
                'name': 'Household behaviour',
                'hint': 'effect on behaviour of individuals (not firms or government)',
                'value': 5
            },
            {
                'name': 'Competitiveness',
                'hint': 'effect on GDP or firm value',
                'value': 6
            },
            {
                'name': 'Employment & Labour market',
                'hint': 'effect on employment or labour market',
                'value': 7
            },
            {
                'name': 'Distribution & Fairness',
                'hint': 'distributional and other social outcomes',
                'value': 8
            },
            {
                'name': 'Cost effectiveness & Efficiency',
                'hint': 'evaluation of the cost effectiveness/efficiency of the policy',
                'value': 9
            },
            {
                'name': 'Implementation process & feasibility',
                'hint': 'e.g. carbon price developments, carbon price expectations, compliance, distribution of allowances, use of off-sets, banking of allowances, administration, political economy',
                'value': 10
            },
            {
                'name': '(Public) Perception',
                'hint': 'Perception of the policy in the general public or groups of people',
                'value': 11
            },
            {
                'name': 'other',
                'hint': 'any other outcomes assessed',
                'value': 12
            },
            {
                'name': 'unknown',
                'hint': 'select, if no information is provided, what outcomes are assessed',
                'value': 13
            },
            {
                'name': 'environmental or health co-benefits',
                'value': 14,
            }
        ],
    },
    'polname': {
        'name': 'Policy name',
        'key': 'polname',
        'hint': 'Select the policy analysed in the study.',
        'kind': 'multi',
        'choices': [
            {
                'name': 'multiple',
                'hint': 'Select, if the study analyses multiple policies, not further specified in the abstract.',
                'value': 0
            },
            {
                'name': 'unclear',
                'hint': 'Select, if it is not clear from the abstract, which policy is assessed.',
                'value': 1
            },
            {
                'name': 'other',
                'hint': 'Select, if the assessed policy is not in the list below.',
                'value': 2
            },
            {
                'name': 'China national ETS',
                'hint': 'implemented in 2021',
                'value': 3
            },
            {
                'name': 'China regional ETS pilots',
                'hint': 'Select, if not further specified, which pilot(s) is assessed.',
                'value': 4
            },
            {
                'name': 'EU ETS',
                'value': 5
            },
            {
                'name': 'British Columbia carbon tax',
                'value': 6
            },
            {
                'name': 'California ETS',
                'value': 7
            },
            {
                'name': 'Quebec ETS',
                'value': 8
            },
            {
                'name': 'RGGI',
                'hint': 'Regional Greenhouse Gas Initiative (some US States)',
                'value': 9
            },
            {
                'name': 'Alberta ETS',
                'value': 10
            },
            {
                'name': 'Argentina carbon tax',
                'hint': 'implemented 2018',
                'value': 11
            },
            {
                'name': 'Austria ETS',
                'hint': 'implemented 2022',
                'value': 12
            },
            {
                'name': 'Baja California carbon tax',
                'hint': 'Mexican state, implemented 2020',
                'value': 13
            },
            {
                'name': 'Beijing pilot ETS',
                'value': 14
            },
            {
                'name': 'Canada federal carbon tax',
                'hint': 'implemented 2019',
                'value': 15
            },
            {
                'name': 'Canada federal ETS',
                'hint': 'implemented 2019',
                'value': 16
            },
            {
                'name': 'Chile carbon tax',
                'hint': 'implemented 2017',
                'value': 17
            },
            {
                'name': 'Chongqing pilot ETS',
                'value': 18
            },
            {
                'name': 'Colombia carbon tax',
                'hint': 'implemented 2017',
                'value': 19
            },
            {
                'name': 'Denmark carbon tax',
                'hint': 'implemented 1992',
                'value': 20
            },
            {
                'name': 'Estonia carbon tax',
                'hint': 'implemented 2000',
                'value': 21
            },
            {
                'name': 'Finland carbon tax',
                'hint': 'implemented 1990',
                'value': 22
            },
            {
                'name': 'France carbon tax',
                'hint': 'implemented 2014',
                'value': 23
            },
            {
                'name': 'Fujian pilot ETS',
                'value': 24
            },
            {
                'name': 'Germany ETS',
                'hint': 'implemented 2021 (sometimes considered carbon tax)',
                'value': 25
            },
            {
                'name': 'Guangdong pilot ETS',
                'value': 26
            },
            {
                'name': 'Hubei pilot ETS',
                'value': 27
            },
            {
                'name': 'Iceland carbon tax',
                'value': 28
            },
            {
                'name': 'Indonesia carbon tax',
                'hint': 'implemented 2022',
                'value': 29
            },
            {
                'name': 'Ireland carbon tax',
                'hint': 'implemented 2010',
                'value': 30
            },
            {
                'name': 'Japan carbon tax',
                'hint': 'implemented 2012',
                'value': 31
            },
            {
                'name': 'Kazakhstan ETS',
                'value': 32
            },
            {
                'name': 'Korea ETS',
                'value': 33
            },
            {
                'name': 'Latvia carbon tax',
                'value': 34
            },
            {
                'name': 'Lichtenstein carbon tax',
                'value': 35
            },
            {
                'name': 'Luxembourg carbon tax',
                'value': 36
            },
            {
                'name': 'Massachusetts ETS',
                'value': 37
            },
            {
                'name': 'Mexico carbon tax',
                'value': 38
            },
            {
                'name': 'Mexico ETS',
                'value': 39
            },
            {
                'name': 'Netherlands carbon tax',
                'value': 40
            },
            {
                'name': 'New Brunswick carbon tax',
                'value': 41
            },
            {
                'name': 'New Brunswick ETS',
                'value': 42
            },
            {
                'name': 'New Zealand ETS',
                'value': 43
            },
            {
                'name': 'Newfoundland and Labrador carbon tax',
                'value': 44
            },
            {
                'name': 'Newfoundland and Labrador ETS',
                'value': 45
            },
            {
                'name': 'Northwest Territories carbon tax',
                'value': 46
            },
            {
                'name': 'Norway carbon tax',
                'value': 47
            },
            {
                'name': 'Nova Scotia ETS',
                'value': 48
            },
            {
                'name': 'Ontario ETS',
                'value': 49
            },
            {
                'name': 'Oregon ETS',
                'value': 50
            },
            {
                'name': 'Poland carbon tax',
                'value': 51
            },
            {
                'name': 'Portugal carbon tax',
                'value': 52
            },
            {
                'name': 'Prince Edward Island carbon tax',
                'value': 53
            },
            {
                'name': 'Saitama ETS',
                'value': 54
            },
            {
                'name': 'Saskatchewan ETS',
                'value': 55
            },
            {
                'name': 'Shanghai pilot ETS',
                'value': 56
            },
            {
                'name': 'Shenzhen pilot ETS',
                'value': 57
            },
            {
                'name': 'Singapore carbon tax',
                'value': 58
            },
            {
                'name': 'Slovenia carbon tax',
                'value': 59
            },
            {
                'name': 'South Africa carbon tax',
                'value': 60
            },
            {
                'name': 'Spain carbon tax',
                'value': 61
            },
            {
                'name': 'Sweden carbon tax',
                'value': 62
            },
            {
                'name': 'Switzerland carbon tax', 'value': 63
            },
            {
                'name': 'Switzerland ETS', 'value': 64
            },
            {
                'name': 'Tamaulipas carbon tax', 'value': 65
            },
            {
                'name': 'Tianjin pilot ETS', 'value': 66
            },
            {
                'name': 'Tokyo ETS', 'value': 67
            },
            {
                'name': 'UK carbon price support', 'value': 68
            },
            {
                'name': 'UK ETS',
                'hint': 'implemented 2021',
                'value': 69
            },
            {
                'name': 'Ukraine carbon tax', 'value': 70
            },
            {
                'name': 'Uruguay carbon tax', 'value': 71
            },
            {
                'name': 'Zacatecas carbon tax', 'value': 72
            },
            {
                'name': 'Australia ETS',
                'hint': 'in force 2012-2014',
                'value': 73
            }
        ]
    },
    'sect': {
        'name': 'Sector',
        'key': 'sect',
        'hint': 'Sectors according to IPCC definition (choose only if specific sectors are mentioned in the abstract)',
        'kind': 'multi',
        'choices': [
            {
                'name': 'Energy',
                'hint': 'Energy sector',
                'value': 0
            },
            {
                'name': 'Industry',
                'hint': 'Industry and waste',
                'value': 1
            },
            {
                'name': 'Transport',
                'hint': 'Transport sector',
                'value': 2
            },
            {
                'name': 'Buildings',
                'hint': 'direct energy use in buildings (e.g. heating, cooking fuels)',
                'value': 3
            },
            {
                'name': 'AFOLU',
                'hint': 'Agriculture, forestry and other land use change',
                'value': 4
            },
            {
                'name': 'Aviation and shipping',
                'value': 5
            }
        ],
    },
    'otherpol': {
        'name': 'Interaction with other policies',
        'key': 'otherpol',
        'hint': 'Is the interaction of the policy with other (climate) policies analysed in the article?',
        'kind': 'bool'
    }
}
