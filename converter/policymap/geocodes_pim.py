import json
import pandas as pd
import pyarrow as pa
from iso31661 import lookup

keys = set()
values = []

FEATURES = [
    'A.',
    'A.ADM1', 'A.ADM1H', 'A.ADM2', 'A.ADM2H', 'A.ADM3', 'A.ADM3H', 'A.ADM4', 'A.ADM4H', 'A.ADM5', 'A.ADM5H', 'A.ADMD',
    'A.ADMDH', 'A.LTER', 'A.PCL', 'A.PCLD', 'A.PCLF', 'A.PCLH', 'A.PCLI', 'A.PCLIX', 'A.PCLS', 'A.PRSH', 'A.TERR',
    'A.ZN', 'A.ZNB',
    'H.',
    'H.AIRS', 'H.ANCH', 'H.BAY', 'H.BAYS', 'H.BGHT', 'H.BNK', 'H.BNKR', 'H.BNKX', 'H.BOG', 'H.CAPG', 'H.CHN', 'H.CHNL',
    'H.CHNM', 'H.CHNN', 'H.CNFL', 'H.CNL', 'H.CNLA', 'H.CNLB', 'H.CNLD', 'H.CNLI', 'H.CNLN', 'H.CNLQ', 'H.CNLSB',
    'H.CNLX', 'H.COVE', 'H.CRKT', 'H.CRNT', 'H.CUTF', 'H.DCK', 'H.DCKB', 'H.DOMG', 'H.DPRG', 'H.DTCH', 'H.DTCHD',
    'H.DTCHI', 'H.DTCHM', 'H.ESTY', 'H.FISH', 'H.FJD', 'H.FJDS', 'H.FLLS', 'H.FLLSX', 'H.FLTM', 'H.FLTT', 'H.GLCR',
    'H.GULF', 'H.GYSR', 'H.HBR', 'H.HBRX', 'H.INLT', 'H.INLTQ', 'H.LBED', 'H.LGN', 'H.LGNS', 'H.LGNX', 'H.LK', 'H.LKC',
    'H.LKI', 'H.LKN', 'H.LKNI', 'H.LKO', 'H.LKOI', 'H.LKS', 'H.LKSB', 'H.LKSC', 'H.LKSI', 'H.LKSN', 'H.LKSNI', 'H.LKX',
    'H.MFGN', 'H.MGV', 'H.MOOR', 'H.MRSH', 'H.MRSHN', 'H.NRWS', 'H.OCN', 'H.OVF', 'H.PND', 'H.PNDI', 'H.PNDN',
    'H.PNDNI', 'H.PNDS', 'H.PNDSF', 'H.PNDSI', 'H.PNDSN', 'H.POOL', 'H.POOLI', 'H.RCH', 'H.RDGG', 'H.RDST', 'H.RF',
    'H.RFC', 'H.RFX', 'H.RPDS', 'H.RSV', 'H.RSVI', 'H.RSVT', 'H.RVN', 'H.SBKH', 'H.SD', 'H.SEA', 'H.SHOL', 'H.SILL',
    'H.SPNG', 'H.SPNS', 'H.SPNT', 'H.STM', 'H.STMA', 'H.STMB', 'H.STMC', 'H.STMD', 'H.STMH', 'H.STMI', 'H.STMIX',
    'H.STMM', 'H.STMQ', 'H.STMS', 'H.STMSB', 'H.STMX', 'H.STRT', 'H.SWMP', 'H.SYSI', 'H.TNLC', 'H.WAD', 'H.WADB',
    'H.WADJ', 'H.WADM', 'H.WADS', 'H.WADX', 'H.WHRL', 'H.WLL', 'H.WLLQ', 'H.WLLS', 'H.WTLD', 'H.WTLDI', 'H.WTRC',
    'H.WTRH',
    'L.',
    'L.AGRC', 'L.AMUS', 'L.AREA', 'L.BSND', 'L.BSNP', 'L.BTL', 'L.CLG', 'L.CMN', 'L.CNS', 'L.COLF', 'L.CONT', 'L.CST',
    'L.CTRB', 'L.DEVH', 'L.FLD', 'L.FLDI', 'L.GASF', 'L.GRAZ', 'L.GVL', 'L.INDS', 'L.LAND', 'L.LCTY', 'L.MILB', 'L.MNA',
    'L.MVA', 'L.NVB', 'L.OAS', 'L.OILF', 'L.PEAT', 'L.PRK', 'L.PRT', 'L.QCKS', 'L.RES', 'L.RESA', 'L.RESF', 'L.RESH',
    'L.RESN', 'L.RESP', 'L.RESV', 'L.RESW', 'L.RGN', 'L.RGNE', 'L.RGNH', 'L.RGNL', 'L.RNGA', 'L.SALT', 'L.SNOW',
    'L.TRB',
    'P.',
    'P.PPL', 'P.PPLA', 'P.PPLA2', 'P.PPLA3', 'P.PPLA4', 'P.PPLA5', 'P.PPLC', 'P.PPLCH', 'P.PPLF', 'P.PPLG', 'P.PPLH',
    'P.PPLL', 'P.PPLQ', 'P.PPLR', 'P.PPLS', 'P.PPLW', 'P.PPLX', 'P.STLMT',
    'R.',
    'R.CSWY', 'R.OILP', 'R.PRMN', 'R.PTGE', 'R.RD', 'R.RDA', 'R.RDB', 'R.RDCUT', 'R.RDJCT', 'R.RJCT', 'R.RR', 'R.RRQ',
    'R.RTE', 'R.RYD', 'R.ST', 'R.STKR', 'R.TNL', 'R.TNLN', 'R.TNLRD', 'R.TNLRR', 'R.TNLS', 'R.TRL',
    'S.',
    'S.ADMF', 'S.AGRF', 'S.AIRB', 'S.AIRF', 'S.AIRH', 'S.AIRP', 'S.AIRQ', 'S.AIRT', 'S.AMTH', 'S.ANS', 'S.AQC',
    'S.ARCH', 'S.ARCHV', 'S.ART', 'S.ASTR', 'S.ASYL', 'S.ATHF', 'S.ATM', 'S.BANK', 'S.BCN', 'S.BDG', 'S.BDGQ',
    'S.BLDA', 'S.BLDG', 'S.BLDO', 'S.BP', 'S.BRKS', 'S.BRKW', 'S.BSTN', 'S.BTYD', 'S.BUR', 'S.BUSTN', 'S.BUSTP',
    'S.CARN', 'S.CAVE', 'S.CH', 'S.CMP', 'S.CMPL', 'S.CMPLA', 'S.CMPMN', 'S.CMPO', 'S.CMPQ', 'S.CMPRF', 'S.CMTY',
    'S.COMC', 'S.CRRL', 'S.CSNO', 'S.CSTL', 'S.CSTM', 'S.CTHSE', 'S.CTRA', 'S.CTRCM', 'S.CTRF', 'S.CTRM', 'S.CTRR',
    'S.CTRS', 'S.CVNT', 'S.DAM', 'S.DAMQ', 'S.DAMSB', 'S.DARY', 'S.DCKD', 'S.DCKY', 'S.DIKE', 'S.DIP', 'S.DPOF',
    'S.EST', 'S.ESTO', 'S.ESTR', 'S.ESTSG', 'S.ESTT', 'S.ESTX', 'S.FCL', 'S.FNDY', 'S.FRM', 'S.FRMQ', 'S.FRMS',
    'S.FRMT', 'S.FT', 'S.FY', 'S.FYT', 'S.GATE', 'S.GDN', 'S.GHAT', 'S.GHSE', 'S.GOSP', 'S.GOVL', 'S.GRVE', 'S.HERM',
    'S.HLT', 'S.HMSD', 'S.HSE', 'S.HSEC', 'S.HSP', 'S.HSPC', 'S.HSPD', 'S.HSPL', 'S.HSTS', 'S.HTL', 'S.HUT', 'S.HUTS',
    'S.INSM', 'S.ITTR', 'S.JTY', 'S.LDNG', 'S.LEPC', 'S.LIBR', 'S.LNDF', 'S.LOCK', 'S.LTHSE', 'S.MALL', 'S.MAR',
    'S.MFG', 'S.MFGB', 'S.MFGC', 'S.MFGCU', 'S.MFGLM', 'S.MFGM', 'S.MFGPH', 'S.MFGQ', 'S.MFGSG', 'S.MKT', 'S.ML',
    'S.MLM', 'S.MLO', 'S.MLSG', 'S.MLSGQ', 'S.MLSW', 'S.MLWND', 'S.MLWTR', 'S.MN', 'S.MNAU', 'S.MNC', 'S.MNCR',
    'S.MNCU', 'S.MNFE', 'S.MNMT', 'S.MNN', 'S.MNQ', 'S.MNQR', 'S.MOLE', 'S.MSQE', 'S.MSSN', 'S.MSSNQ', 'S.MSTY',
    'S.MTRO', 'S.MUS', 'S.NOV', 'S.NSY', 'S.OBPT', 'S.OBS', 'S.OBSR', 'S.OILJ', 'S.OILQ', 'S.OILR', 'S.OILT', 'S.OILW',
    'S.OPRA', 'S.PAL', 'S.PGDA', 'S.PIER', 'S.PKLT', 'S.PMPO', 'S.PMPW', 'S.PO', 'S.PP', 'S.PPQ', 'S.PRKGT', 'S.PRKHQ',
    'S.PRN', 'S.PRNJ', 'S.PRNQ', 'S.PS', 'S.PSH', 'S.PSN', 'S.PSTB', 'S.PSTC', 'S.PSTP', 'S.PYR', 'S.PYRS', 'S.QUAY',
    'S.RDCR', 'S.RDIN', 'S.RECG', 'S.RECR', 'S.REST', 'S.RET', 'S.RHSE', 'S.RKRY', 'S.RLG', 'S.RLGR', 'S.RNCH', 'S.RSD',
    'S.RSGNL', 'S.RSRT', 'S.RSTN', 'S.RSTNQ', 'S.RSTP', 'S.RSTPQ', 'S.RUIN', 'S.SCH', 'S.SCHA', 'S.SCHC', 'S.SCHL',
    'S.SCHM', 'S.SCHN', 'S.SCHT', 'S.SECP', 'S.SHPF', 'S.SHRN', 'S.SHSE', 'S.SLCE', 'S.SNTR', 'S.SPA', 'S.SPLY',
    'S.SQR', 'S.STBL', 'S.STDM', 'S.STNB', 'S.STNC', 'S.STNE', 'S.STNF', 'S.STNI', 'S.STNM', 'S.STNR', 'S.STNS',
    'S.STNW', 'S.STPS', 'S.SWT', 'S.SYG', 'S.THTR', 'S.TMB', 'S.TMPL', 'S.TNKD', 'S.TOLL', 'S.TOWR', 'S.TRAM',
    'S.TRANT', 'S.TRIG', 'S.TRMO', 'S.TWO', 'S.UNIP', 'S.UNIV', 'S.USGE', 'S.VETF', 'S.WALL', 'S.WALLA', 'S.WEIR',
    'S.WHRF', 'S.WRCK', 'S.WTRW', 'S.ZNF', 'S.ZOO',
    'T.',
    'T.ASPH', 'T.ATOL', 'T.BAR', 'T.BCH', 'T.BCHS', 'T.BDLD', 'T.BLDR', 'T.BLHL', 'T.BLOW', 'T.BNCH', 'T.BUTE',
    'T.CAPE', 'T.CFT', 'T.CLDA', 'T.CLF', 'T.CNYN', 'T.CONE', 'T.CRDR', 'T.CRQ', 'T.CRQS', 'T.CRTR', 'T.CUET',
    'T.DLTA', 'T.DPR', 'T.DSRT', 'T.DUNE', 'T.DVD', 'T.ERG', 'T.FAN', 'T.FORD', 'T.FSR', 'T.GAP', 'T.GRGE', 'T.HDLD',
    'T.HLL', 'T.HLLS', 'T.HMCK', 'T.HMDA', 'T.INTF', 'T.ISL', 'T.ISLET', 'T.ISLF', 'T.ISLM', 'T.ISLS', 'T.ISLT',
    'T.ISLX', 'T.ISTH', 'T.KRST', 'T.LAVA', 'T.LEV', 'T.MESA', 'T.MND', 'T.MRN', 'T.MT', 'T.MTS', 'T.NKM', 'T.NTK',
    'T.NTKS', 'T.PAN', 'T.PANS', 'T.PASS', 'T.PEN', 'T.PENX', 'T.PK', 'T.PKS', 'T.PLAT', 'T.PLATX', 'T.PLDR', 'T.PLN',
    'T.PLNX', 'T.PROM', 'T.PT', 'T.PTS', 'T.RDGB', 'T.RDGE', 'T.REG', 'T.RK', 'T.RKFL', 'T.RKS', 'T.SAND', 'T.SBED',
    'T.SCRP', 'T.SDL', 'T.SHOR', 'T.SINK', 'T.SLID', 'T.SLP', 'T.SPIT', 'T.SPUR', 'T.TAL', 'T.TRGD', 'T.TRR', 'T.UPLD',
    'T.VAL', 'T.VALG', 'T.VALS', 'T.VALX', 'T.VLC',
    'U.',
    'U.APNU', 'U.ARCU', 'U.ARRU', 'U.BDLU', 'U.BKSU', 'U.BNKU', 'U.BSNU', 'U.CDAU', 'U.CNSU', 'U.CNYU', 'U.CRSU',
    'U.DEPU', 'U.EDGU', 'U.ESCU', 'U.FANU', 'U.FLTU', 'U.FRZU', 'U.FURU', 'U.GAPU', 'U.GLYU', 'U.HLLU', 'U.HLSU',
    'U.HOLU', 'U.KNLU', 'U.KNSU', 'U.LDGU', 'U.LEVU', 'U.MESU', 'U.MNDU', 'U.MOTU', 'U.MTU', 'U.PKSU', 'U.PKU',
    'U.PLNU', 'U.PLTU', 'U.PNLU', 'U.PRVU', 'U.RDGU', 'U.RDSU', 'U.RFSU', 'U.RFU', 'U.RISU', 'U.SCNU', 'U.SCSU',
    'U.SDLU', 'U.SHFU', 'U.SHLU', 'U.SHSU', 'U.SHVU', 'U.SILU', 'U.SLPU', 'U.SMSU', 'U.SMU', 'U.SPRU', 'U.TERU',
    'U.TMSU', 'U.TMTU', 'U.TNGU', 'U.TRGU', 'U.TRNU', 'U.VALU', 'U.VLSU',
    'V.',
    'V.BUSH', 'V.CULT', 'V.FRST', 'V.FRSTF', 'V.GROVE', 'V.GRSLD', 'V.GRVC', 'V.GRVO', 'V.GRVP', 'V.GRVPN', 'V.HTH',
    'V.MDW', 'V.OCH', 'V.SCRB', 'V.TREE', 'V.TUND', 'V.VIN', 'V.VINS']

FEATURE_LOOKUP = {f: i for i, f in enumerate(FEATURES)}

with open('../.data/policymap/raw/cpm_places.jsonl', 'r') as f:
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
df.to_csv('../.data/policymap/geocodes.csv', index=False)

schema = pa.schema([
    pa.field('idx', pa.uint32()),
    # pa.field('country', pa.string())
    pa.field('country_num', pa.uint16())
])
fa = pa.Table.from_pandas(df=df[schema.names], schema=schema)
with pa.OSFile('../.data/policymap/geocodes.minimal.arrow', 'wb') as sink:
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
with pa.OSFile('../.data/policymap/geocodes.full.arrow', 'wb') as sink:
    with pa.ipc.new_file(sink, schema=schema) as writer:
        for batch in fa.to_batches(2000):
            # batch_ = pa.record_batch(batch, schema=schema)
            writer.write(batch)

# print(json.dumps(FEATURE_LOOKUP, indent=2))
