import type { DataType, TypeMap } from "apache-arrow/type";
import type { Type } from "apache-arrow/enum";
import { type Table, tableFromIPC } from "apache-arrow";
import { GET, request } from "@/util/api.ts";
import { feature, type WorldAtlas } from "topojson";
import { geoMercator, geoPath } from "d3-geo";
import type { GeometryCollection } from "topojson-specification";
import type { Feature, FeatureCollection, GeometryObject } from "geojson";
import { GeoProjection } from "d3";

export interface CountryProp {
  name: string;
}

export interface SlimPlacesSchema extends TypeMap {
  idx: DataType<Type.Uint32>;
  country_num: DataType<Type.Uint16>;
}

export interface FullPlacesSchema extends TypeMap {
  idx: DataType<Type.Uint32>;
  geonameid: DataType<Type.Uint32>;
  country_num: DataType<Type.Uint16>;
  lat: DataType<Type.Float16>;
  lon: DataType<Type.Float16>;
  name: DataType<Type.Utf8>;
  // class: DataType<Type.Utf8>;
  // code: DataType<Type.Utf8>;
  feature: DataType<Type.Uint16>;
}

export interface SlimData {
  counts: Record<number, number>;
  documents: Record<number, number[]>;
}

export interface FullEntry {
  idx: number;
  geonameid: number;
  country_num: number;
  lat: number;
  lon: number;
  name: string;
  // class: string;
  // code: string;
  feature: number;
}

export type ProjectedEntry = FullEntry & { xy: [number, number] };
export type ProjectedEntry_ = FullEntry & { xy: [number, number] | null };

export function translateSlimTable(table: Table<SlimPlacesSchema>): SlimData {
  const idxs = table.getChild("idx")!;
  const countries = table.getChild("country_num")!;
  const { numRows } = table;
  const counts: Record<number, number> = {};
  const documents: Record<number, number[]> = {};
  let _country: number;
  let _idx: number;
  for (let i = 0; i < numRows; i++) {
    _country = countries.get(i);
    _idx = idxs.get(i);
    if (!(_country in counts)) {
      counts[_country] = 1;
      documents[_country] = [_idx];
    } else {
      counts[_country] += 1;
      documents[_country].push(_idx);
    }
  }
  return { counts, documents };
}

export function translateFullTable(
  table: Table<FullPlacesSchema>,
  projection: GeoProjection,
): Record<number, ProjectedEntry_[]> {
  const ret: Record<number, ProjectedEntry_[]> = {};
  let loc: FullEntry;
  for (const row of table) {
    loc = row.toJSON();
    if (loc.country_num in ret) ret[loc.country_num].push({ xy: projection([loc.lon, loc.lat]), ...loc });
    else ret[loc.country_num] = [{ xy: projection([loc.lon, loc.lat]), ...loc }];
  }
  return ret;
}

export type Countries = FeatureCollection<GeometryObject, CountryProp>;
export type Country = Feature<GeometryObject, CountryProp>;

export function useGeodata(slimUrl: string, fullUrl: string) {
  let _world: WorldAtlas | null = null;
  let _topo: Countries;

  let _slim: SlimData | null = null;
  let _full: Record<number, ProjectedEntry_[]> | null = null;

  const projection = geoMercator();
  const path = geoPath().projection(projection);

  async function world(): Promise<WorldAtlas> {
    if (_world) return Promise.resolve(_world);
    _world = await GET<WorldAtlas>({ path: "countries-50m.json", keepPath: true });
    return _world;
  }

  async function topo(): Promise<Countries> {
    if (_topo) return Promise.resolve(_topo);
    const w = await world();
    _topo = feature<CountryProp>(w, w.objects.countries as GeometryCollection<CountryProp>);
    return _topo;
  }

  async function geo() {
    return {
      world: await world(),
      topo: await topo(),
      projection,
      path,
    };
  }

  async function slim(): Promise<SlimData> {
    if (_slim) return Promise.resolve(_slim);
    const req = await request({ method: "GET", path: slimUrl, keepPath: true });
    const places = await tableFromIPC<SlimPlacesSchema>(req.arrayBuffer());
    _slim = translateSlimTable(places);
    return _slim;
  }

  async function full(): Promise<Record<number, ProjectedEntry_[]>> {
    if (_full) return Promise.resolve(_full);
    const req = await request({ method: "GET", path: fullUrl, keepPath: true });
    const places = await tableFromIPC<FullPlacesSchema>(req.arrayBuffer());
    _full = translateFullTable(places, projection);
    return _full;
  }

  return {
    world,
    topo,
    path,
    projection,
    geo,

    slim,
    full,
  };
}

/*
http://www.geonames.org/export/codes.html
Mapping of classes/codes to numeric `feature` column

0 A.
1 A.ADM1
2 A.ADM1H
3 A.ADM2
4 A.ADM2H
5 A.ADM3
6 A.ADM3H
7 A.ADM4
8 A.ADM4H
9 A.ADM5
10 A.ADM5H
11 A.ADMD
12 A.ADMDH
13 A.LTER
14 A.PCL
15 A.PCLD
16 A.PCLF
17 A.PCLH
18 A.PCLI
19 A.PCLIX
20 A.PCLS
21 A.PRSH
22 A.TERR
23 A.ZN
24 A.ZNB
25 H.
26 H.AIRS
27 H.ANCH
28 H.BAY
29 H.BAYS
30 H.BGHT
31 H.BNK
32 H.BNKR
33 H.BNKX
34 H.BOG
35 H.CAPG
36 H.CHN
37 H.CHNL
38 H.CHNM
39 H.CHNN
40 H.CNFL
41 H.CNL
42 H.CNLA
43 H.CNLB
44 H.CNLD
45 H.CNLI
46 H.CNLN
47 H.CNLQ
48 H.CNLSB
49 H.CNLX
50 H.COVE
51 H.CRKT
52 H.CRNT
53 H.CUTF
54 H.DCK
55 H.DCKB
56 H.DOMG
57 H.DPRG
58 H.DTCH
59 H.DTCHD
60 H.DTCHI
61 H.DTCHM
62 H.ESTY
63 H.FISH
64 H.FJD
65 H.FJDS
66 H.FLLS
67 H.FLLSX
68 H.FLTM
69 H.FLTT
70 H.GLCR
71 H.GULF
72 H.GYSR
73 H.HBR
74 H.HBRX
75 H.INLT
76 H.INLTQ
77 H.LBED
78 H.LGN
79 H.LGNS
80 H.LGNX
81 H.LK
82 H.LKC
83 H.LKI
84 H.LKN
85 H.LKNI
86 H.LKO
87 H.LKOI
88 H.LKS
89 H.LKSB
90 H.LKSC
91 H.LKSI
92 H.LKSN
93 H.LKSNI
94 H.LKX
95 H.MFGN
96 H.MGV
97 H.MOOR
98 H.MRSH
99 H.MRSHN
100 H.NRWS
101 H.OCN
102 H.OVF
103 H.PND
104 H.PNDI
105 H.PNDN
106 H.PNDNI
107 H.PNDS
108 H.PNDSF
109 H.PNDSI
110 H.PNDSN
111 H.POOL
112 H.POOLI
113 H.RCH
114 H.RDGG
115 H.RDST
116 H.RF
117 H.RFC
118 H.RFX
119 H.RPDS
120 H.RSV
121 H.RSVI
122 H.RSVT
123 H.RVN
124 H.SBKH
125 H.SD
126 H.SEA
127 H.SHOL
128 H.SILL
129 H.SPNG
130 H.SPNS
131 H.SPNT
132 H.STM
133 H.STMA
134 H.STMB
135 H.STMC
136 H.STMD
137 H.STMH
138 H.STMI
139 H.STMIX
140 H.STMM
141 H.STMQ
142 H.STMS
143 H.STMSB
144 H.STMX
145 H.STRT
146 H.SWMP
147 H.SYSI
148 H.TNLC
149 H.WAD
150 H.WADB
151 H.WADJ
152 H.WADM
153 H.WADS
154 H.WADX
155 H.WHRL
156 H.WLL
157 H.WLLQ
158 H.WLLS
159 H.WTLD
160 H.WTLDI
161 H.WTRC
162 H.WTRH
163 L.
164 L.AGRC
165 L.AMUS
166 L.AREA
167 L.BSND
168 L.BSNP
169 L.BTL
170 L.CLG
171 L.CMN
172 L.CNS
173 L.COLF
174 L.CONT
175 L.CST
176 L.CTRB
177 L.DEVH
178 L.FLD
179 L.FLDI
180 L.GASF
181 L.GRAZ
182 L.GVL
183 L.INDS
184 L.LAND
185 L.LCTY
186 L.MILB
187 L.MNA
188 L.MVA
189 L.NVB
190 L.OAS
191 L.OILF
192 L.PEAT
193 L.PRK
194 L.PRT
195 L.QCKS
196 L.RES
197 L.RESA
198 L.RESF
199 L.RESH
200 L.RESN
201 L.RESP
202 L.RESV
203 L.RESW
204 L.RGN
205 L.RGNE
206 L.RGNH
207 L.RGNL
208 L.RNGA
209 L.SALT
210 L.SNOW
211 L.TRB
212 P.
213 P.PPL
214 P.PPLA
215 P.PPLA2
216 P.PPLA3
217 P.PPLA4
218 P.PPLA5
219 P.PPLC
220 P.PPLCH
221 P.PPLF
222 P.PPLG
223 P.PPLH
224 P.PPLL
225 P.PPLQ
226 P.PPLR
227 P.PPLS
228 P.PPLW
229 P.PPLX
230 P.STLMT
231 R.
232 R.CSWY
233 R.OILP
234 R.PRMN
235 R.PTGE
236 R.RD
237 R.RDA
238 R.RDB
239 R.RDCUT
240 R.RDJCT
241 R.RJCT
242 R.RR
243 R.RRQ
244 R.RTE
245 R.RYD
246 R.ST
247 R.STKR
248 R.TNL
249 R.TNLN
250 R.TNLRD
251 R.TNLRR
252 R.TNLS
253 R.TRL
254 S.
255 S.ADMF
256 S.AGRF
257 S.AIRB
258 S.AIRF
259 S.AIRH
260 S.AIRP
261 S.AIRQ
262 S.AIRT
263 S.AMTH
264 S.ANS
265 S.AQC
266 S.ARCH
267 S.ARCHV
268 S.ART
269 S.ASTR
270 S.ASYL
271 S.ATHF
272 S.ATM
273 S.BANK
274 S.BCN
275 S.BDG
276 S.BDGQ
277 S.BLDA
278 S.BLDG
279 S.BLDO
280 S.BP
281 S.BRKS
282 S.BRKW
283 S.BSTN
284 S.BTYD
285 S.BUR
286 S.BUSTN
287 S.BUSTP
288 S.CARN
289 S.CAVE
290 S.CH
291 S.CMP
292 S.CMPL
293 S.CMPLA
294 S.CMPMN
295 S.CMPO
296 S.CMPQ
297 S.CMPRF
298 S.CMTY
299 S.COMC
300 S.CRRL
301 S.CSNO
302 S.CSTL
303 S.CSTM
304 S.CTHSE
305 S.CTRA
306 S.CTRCM
307 S.CTRF
308 S.CTRM
309 S.CTRR
310 S.CTRS
311 S.CVNT
312 S.DAM
313 S.DAMQ
314 S.DAMSB
315 S.DARY
316 S.DCKD
317 S.DCKY
318 S.DIKE
319 S.DIP
320 S.DPOF
321 S.EST
322 S.ESTO
323 S.ESTR
324 S.ESTSG
325 S.ESTT
326 S.ESTX
327 S.FCL
328 S.FNDY
329 S.FRM
330 S.FRMQ
331 S.FRMS
332 S.FRMT
333 S.FT
334 S.FY
335 S.FYT
336 S.GATE
337 S.GDN
338 S.GHAT
339 S.GHSE
340 S.GOSP
341 S.GOVL
342 S.GRVE
343 S.HERM
344 S.HLT
345 S.HMSD
346 S.HSE
347 S.HSEC
348 S.HSP
349 S.HSPC
350 S.HSPD
351 S.HSPL
352 S.HSTS
353 S.HTL
354 S.HUT
355 S.HUTS
356 S.INSM
357 S.ITTR
358 S.JTY
359 S.LDNG
360 S.LEPC
361 S.LIBR
362 S.LNDF
363 S.LOCK
364 S.LTHSE
365 S.MALL
366 S.MAR
367 S.MFG
368 S.MFGB
369 S.MFGC
370 S.MFGCU
371 S.MFGLM
372 S.MFGM
373 S.MFGPH
374 S.MFGQ
375 S.MFGSG
376 S.MKT
377 S.ML
378 S.MLM
379 S.MLO
380 S.MLSG
381 S.MLSGQ
382 S.MLSW
383 S.MLWND
384 S.MLWTR
385 S.MN
386 S.MNAU
387 S.MNC
388 S.MNCR
389 S.MNCU
390 S.MNFE
391 S.MNMT
392 S.MNN
393 S.MNQ
394 S.MNQR
395 S.MOLE
396 S.MSQE
397 S.MSSN
398 S.MSSNQ
399 S.MSTY
400 S.MTRO
401 S.MUS
402 S.NOV
403 S.NSY
404 S.OBPT
405 S.OBS
406 S.OBSR
407 S.OILJ
408 S.OILQ
409 S.OILR
410 S.OILT
411 S.OILW
412 S.OPRA
413 S.PAL
414 S.PGDA
415 S.PIER
416 S.PKLT
417 S.PMPO
418 S.PMPW
419 S.PO
420 S.PP
421 S.PPQ
422 S.PRKGT
423 S.PRKHQ
424 S.PRN
425 S.PRNJ
426 S.PRNQ
427 S.PS
428 S.PSH
429 S.PSN
430 S.PSTB
431 S.PSTC
432 S.PSTP
433 S.PYR
434 S.PYRS
435 S.QUAY
436 S.RDCR
437 S.RDIN
438 S.RECG
439 S.RECR
440 S.REST
441 S.RET
442 S.RHSE
443 S.RKRY
444 S.RLG
445 S.RLGR
446 S.RNCH
447 S.RSD
448 S.RSGNL
449 S.RSRT
450 S.RSTN
451 S.RSTNQ
452 S.RSTP
453 S.RSTPQ
454 S.RUIN
455 S.SCH
456 S.SCHA
457 S.SCHC
458 S.SCHL
459 S.SCHM
460 S.SCHN
461 S.SCHT
462 S.SECP
463 S.SHPF
464 S.SHRN
465 S.SHSE
466 S.SLCE
467 S.SNTR
468 S.SPA
469 S.SPLY
470 S.SQR
471 S.STBL
472 S.STDM
473 S.STNB
474 S.STNC
475 S.STNE
476 S.STNF
477 S.STNI
478 S.STNM
479 S.STNR
480 S.STNS
481 S.STNW
482 S.STPS
483 S.SWT
484 S.SYG
485 S.THTR
486 S.TMB
487 S.TMPL
488 S.TNKD
489 S.TOLL
490 S.TOWR
491 S.TRAM
492 S.TRANT
493 S.TRIG
494 S.TRMO
495 S.TWO
496 S.UNIP
497 S.UNIV
498 S.USGE
499 S.VETF
500 S.WALL
501 S.WALLA
502 S.WEIR
503 S.WHRF
504 S.WRCK
505 S.WTRW
506 S.ZNF
507 S.ZOO
508 T.
509 T.ASPH
510 T.ATOL
511 T.BAR
512 T.BCH
513 T.BCHS
514 T.BDLD
515 T.BLDR
516 T.BLHL
517 T.BLOW
518 T.BNCH
519 T.BUTE
520 T.CAPE
521 T.CFT
522 T.CLDA
523 T.CLF
524 T.CNYN
525 T.CONE
526 T.CRDR
527 T.CRQ
528 T.CRQS
529 T.CRTR
530 T.CUET
531 T.DLTA
532 T.DPR
533 T.DSRT
534 T.DUNE
535 T.DVD
536 T.ERG
537 T.FAN
538 T.FORD
539 T.FSR
540 T.GAP
541 T.GRGE
542 T.HDLD
543 T.HLL
544 T.HLLS
545 T.HMCK
546 T.HMDA
547 T.INTF
548 T.ISL
549 T.ISLET
550 T.ISLF
551 T.ISLM
552 T.ISLS
553 T.ISLT
554 T.ISLX
555 T.ISTH
556 T.KRST
557 T.LAVA
558 T.LEV
559 T.MESA
560 T.MND
561 T.MRN
562 T.MT
563 T.MTS
564 T.NKM
565 T.NTK
566 T.NTKS
567 T.PAN
568 T.PANS
569 T.PASS
570 T.PEN
571 T.PENX
572 T.PK
573 T.PKS
574 T.PLAT
575 T.PLATX
576 T.PLDR
577 T.PLN
578 T.PLNX
579 T.PROM
580 T.PT
581 T.PTS
582 T.RDGB
583 T.RDGE
584 T.REG
585 T.RK
586 T.RKFL
587 T.RKS
588 T.SAND
589 T.SBED
590 T.SCRP
591 T.SDL
592 T.SHOR
593 T.SINK
594 T.SLID
595 T.SLP
596 T.SPIT
597 T.SPUR
598 T.TAL
599 T.TRGD
600 T.TRR
601 T.UPLD
602 T.VAL
603 T.VALG
604 T.VALS
605 T.VALX
606 T.VLC
607 U.
608 U.APNU
609 U.ARCU
610 U.ARRU
611 U.BDLU
612 U.BKSU
613 U.BNKU
614 U.BSNU
615 U.CDAU
616 U.CNSU
617 U.CNYU
618 U.CRSU
619 U.DEPU
620 U.EDGU
621 U.ESCU
622 U.FANU
623 U.FLTU
624 U.FRZU
625 U.FURU
626 U.GAPU
627 U.GLYU
628 U.HLLU
629 U.HLSU
630 U.HOLU
631 U.KNLU
632 U.KNSU
633 U.LDGU
634 U.LEVU
635 U.MESU
636 U.MNDU
637 U.MOTU
638 U.MTU
639 U.PKSU
640 U.PKU
641 U.PLNU
642 U.PLTU
643 U.PNLU
644 U.PRVU
645 U.RDGU
646 U.RDSU
647 U.RFSU
648 U.RFU
649 U.RISU
650 U.SCNU
651 U.SCSU
652 U.SDLU
653 U.SHFU
654 U.SHLU
655 U.SHSU
656 U.SHVU
657 U.SILU
658 U.SLPU
659 U.SMSU
660 U.SMU
661 U.SPRU
662 U.TERU
663 U.TMSU
664 U.TMTU
665 U.TNGU
666 U.TRGU
667 U.TRNU
668 U.VALU
669 U.VLSU
670 V.
671 V.BUSH
672 V.CULT
673 V.FRST
674 V.FRSTF
675 V.GROVE
676 V.GRSLD
677 V.GRVC
678 V.GRVO
679 V.GRVP
680 V.GRVPN
681 V.HTH
682 V.MDW
683 V.OCH
684 V.SCRB
685 V.TREE
686 V.TUND
687 V.VIN
688 V.VINS
*/
