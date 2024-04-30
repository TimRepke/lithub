import type {
  ReadonlyRef,
  AnnotatedDocument,
  ArrowSchema,
  DatasetInfo,
  Keyword,
  KeywordArrowSchema,
  SchemeGroup,
  SchemeLabel,
} from "@/util/types";
import { type Bitmask, and, or, isNew } from "@/util/dataset/masks/bitmask.ts";
import { DATA_BASE, POST, request, RequestWithProgress } from "@/util/api.ts";
import { type Ref, type ComputedRef, readonly, ref, toRef, watch, computed } from "vue";
import { type Table, tableFromIPC } from "apache-arrow";
import { type HistogramMask, useHistogramMask } from "@/util/dataset/masks/histogram.ts";
import { None, useDelay } from "@/util/index.ts";
import { Indexes, type IndexMask, IndexMasks, useIndexMasks } from "@/util/dataset/masks/ids.ts";
import {
  type LabelMaskGroup,
  type LabelValueMask,
  loadLabelValueMask,
  useLabelMaskGroup,
  useLabelValueMask,
} from "@/util/dataset/masks/labels.ts";
import { SearchMask, useSearchMask } from "@/util/dataset/masks/search.ts";
import { Counts } from "@/util/dataset/masks/base.ts";

// get filtered array from mask (like np.array([1,2,3,4])[[True, True, False, True]]
// Array.prototype.maskFilter = function(mask) {
//   return this.filter((item, i) => mask[i]);
// }
export type AnyMask = IndexMask | HistogramMask | LabelMaskGroup | SearchMask;

export interface Dataset<K extends Indexes> {
  info: DatasetInfo;
  name: string;
  arrow: Table<ArrowSchema>;
  counts: ReadonlyRef<Counts>;
  version: ReadonlyRef<number>;
  groups: Record<string, SchemeGroup>;
  labels: Record<string, SchemeLabel>;

  labelMaskGroups: Record<string, LabelMaskGroup>; // masks for all the annotations
  pyMask: HistogramMask; // masks for publication years
  indexMasks: IndexMasks<K>; // masks for document ids (esp. for scatterplot)
  searchMask: SearchMask; // mask for title/abstract search (server-side filtering)
  // doiMask: SearchMask;// mask for DOI search (server-side filtering)

  bitmask: Ref<Bitmask | None>; // aggregate global mask
  inclusive: Ref<boolean>; // when true, use OR for combination, else AND
  keywords: Ref<Keyword[]>;
  pickedColour: Ref<string>;

  hasActiveMask(): boolean;

  masks(): Generator<AnyMask, void, any>;

  activeMasks(): Generator<AnyMask, void, any>;

  activeLabelMasks(): Generator<LabelValueMask, void, any>;

  activeBitmasks(): Generator<Bitmask | None, void, any>;

  activeLabelMaskColumns(): Generator<string, void, any>;

  documents(dparams: { ids?: string[] | null; page?: number; limit?: number }): Promise<AnnotatedDocument[]>;
}

export function useDataset<K extends Indexes>(params: {
  info: DatasetInfo;
  labelMasks: Record<string, LabelMaskGroup>;
  arrow: Table<ArrowSchema>;
}): Dataset<K> {
  const {
    groups,
    labels,
    start_year: startYear,
    end_year: endYear,
    key: name,
    default_colour: defaultColour,
    keywords_filename,
    total,
  } = params.info;

  const inclusive = ref(false);
  const _counts = ref({
    countFiltered: total,
    countTotal: total,
  });
  const counts = readonly(_counts);
  const _version = ref(0);
  const version = readonly(_version);

  const pyYears = params.arrow.getChild("publication_year");
  if (!pyYears) throw new Error("Missing publication_years column in arrow file!");
  // @ts-ignore
  const pyMask = useHistogramMask(startYear, endYear, pyYears);
  const searchMask = useSearchMask(name);
  const indexMasks = useIndexMasks(total);

  const bitmask = ref<Bitmask | None>();

  const keywords = ref<Keyword[]>([]);
  if (params.info.keywords_filename) {
    request({ method: "GET", path: `${DATA_BASE}/${name}/${keywords_filename}`, keepPath: true }).then(
      async (response) => {
        const keywordsArrow = await tableFromIPC<KeywordArrowSchema>(response.arrayBuffer());
        const xs = keywordsArrow.getChild("x")!;
        const ys = keywordsArrow.getChild("y")!;
        const levels = keywordsArrow.getChild("level")!;
        const kws = keywordsArrow.getChild("keyword")!;

        const _keywords: Keyword[] = new Array(keywordsArrow.numRows);
        for (let i = 0; i < keywordsArrow.numRows; i++) {
          _keywords[i] = { x: xs.get(i), y: ys.get(i), level: levels.get(i), keyword: kws.get(i) };
        }
        // sort by level so later on we can just grab the first N keywords and get from top to bottom
        _keywords.sort((a, b) => a.level - b.level);
        keywords.value = _keywords;
      },
    );
  }

  const pickedColour = ref(defaultColour);

  function update() {
    const newMask = inclusive.value ? or(...activeBitmasks()) : and(...activeBitmasks());
    if (isNew(bitmask.value, newMask)) {
      bitmask.value = newMask;
      for (const mask of masks()) {
        mask.updateCounts(hasActiveMask() ? bitmask.value : null);
      }
      _counts.value.countFiltered = bitmask.value?.count ?? _counts.value.countTotal;
      _version.value += 1;
    }
  }

  function hasActiveMask(): boolean {
    return [...activeMasks()].length > 0;
  }

  function* masks() {
    for (const mask of Object.values(params.labelMasks)) yield mask;
    for (const mask of Object.values(indexMasks.masks)) yield mask;
    yield searchMask;
    yield pyMask;
  }

  function* activeMasks() {
    for (const mask of masks()) if (mask.active?.value ?? mask.active) yield mask;
  }

  function* activeBitmasks() {
    for (const mask of activeMasks()) if (mask.bitmask?.value) yield mask.bitmask.value;
  }

  function* activeLabelMasks() {
    for (const mask of Object.values(params.labelMasks)) {
      if (mask.active.value) {
        for (const labelMask of Object.values(mask.masks)) {
          if (labelMask.active.value) {
            yield labelMask;
          }
        }
      }
    }
  }

  function* activeLabelMaskColumns() {
    for (const mask of activeLabelMasks()) yield mask.key;
  }

  async function documents(dparams: {
    ids?: string[] | null;
    page?: number;
    limit?: number;
  }): Promise<AnnotatedDocument[]> {
    const orderBy = [...activeLabelMaskColumns()];
    const mask = (!dparams.ids || dparams.ids.length === 0) && hasActiveMask() ? bitmask.value?.toBase64() : undefined;
    return await POST<AnnotatedDocument[]>({
      path: "/basic/documents",
      params: {
        limit: dparams.limit ?? 10,
        page: dparams.page ?? 0,
        dataset: name,
      },
      payload: {
        ids: dparams.ids,
        bitmask: mask,
        order_by: orderBy,
      },
    });
  }

  // set up watchers so we can bubble up changes
  watch(
    [...masks()].map((mask) => mask.version),
    update,
  );
  watch(inclusive, update);

  return {
    info: params.info,
    name: name,
    groups,
    labels,
    arrow: params.arrow,
    counts: toRef(counts),
    version: toRef(version),
    inclusive: toRef(inclusive),
    pickedColour: toRef(pickedColour),
    pyMask,
    searchMask,
    indexMasks,
    labelMaskGroups: params.labelMasks,
    bitmask: toRef(bitmask),
    keywords: toRef(keywords),
    hasActiveMask,
    masks,
    activeMasks,
    activeBitmasks,
    activeLabelMasks,
    activeLabelMaskColumns,
    documents,
  };
}

export interface Results {
  documents: Ref<AnnotatedDocument[]>;
  page: Ref<number>;
  limit: Ref<number>;
  paused: Ref<boolean>;
  numPages: ComputedRef<number>;
  pages: ComputedRef<number[]>;
  next: () => void;
  prev: () => void;
  update: () => void;
  delayedUpdate: () => void;
  hasPrev: ComputedRef<boolean>;
  hasNext: ComputedRef<boolean>;
}

export function useResults<K extends Indexes>(dataset: Dataset<K>): Results {
  // const dataStore = useDatasetStore();
  const REQUEST_DELAY = 250;
  const MAX_PAGES = 8;

  const paused = ref(false);
  const page = ref(0);
  const limit = ref(10);
  const documents = ref<AnnotatedDocument[]>([]);

  const { call: update, delayedCall: delayedUpdate } = useDelay(async () => {
    if (!paused.value) {
      documents.value = await dataset.documents({ page: page.value, limit: limit.value });
    }
    return documents.value;
  }, REQUEST_DELAY);

  const hasNext = computed(() => page.value < numPages.value - 1);

  function next() {
    if (hasNext.value) page.value += 1;
  }

  const hasPrev = computed(() => page.value > 0);

  function prev() {
    if (hasPrev.value) page.value -= 1;
  }

  const numPages = computed(() => {
    const total = dataset.counts.value.countFiltered;
    return Math.ceil((total ?? 0) / limit.value);
  });
  const pages = computed(() => {
    if (numPages.value <= MAX_PAGES) {
      return [...Array(numPages.value).keys()];
    }
    if (page.value + MAX_PAGES / 2 > numPages.value) {
      const firstPage = Math.max(0, numPages.value - MAX_PAGES);
      return [...Array(MAX_PAGES).keys()].map((p) => p + firstPage);
    }
    const firstPage = Math.max(0, page.value - MAX_PAGES / 2);
    return [...Array(Math.min(MAX_PAGES)).keys()].map((p) => p + firstPage);
  });

  watch(dataset.version, delayedUpdate);
  watch([page, limit], update);

  return {
    documents: toRef(documents),
    paused: toRef(paused),
    page: toRef(page),
    limit: toRef(limit),
    numPages: toRef(numPages),
    pages: toRef(pages),
    hasPrev: toRef(hasPrev),
    hasNext: toRef(hasNext),
    next,
    prev,
    update,
    delayedUpdate,
  };
}

type BufferEntry = SchemeLabel & { mask: LabelValueMask };

export async function loadDataset<K extends Indexes>(params: {
  info: DatasetInfo;
  maskCallback: (colsLoaded: number) => void;
  dataCallback: (bytesLoaded: number) => void;
  threshold?: number;
}): Promise<Dataset<K>> {
  const { labels, groups, key: dataset, arrow_filename: arrowFile } = params.info;

  return new Promise(async (resolve: (res: Dataset<K>) => void, reject) => {
    // request all masks
    let numLoadedMasks = 0;
    const maskBuffer: Record<string, BufferEntry> = {};
    const maskPromises = Object.values(labels) //
      .map(async (label) => {
        maskBuffer[label.key] = {
          ...label,
          mask: await loadLabelValueMask({
            dataset: dataset,
            name: label.name,
            key: label.key,
            value: label.value,
            colour: label.colour,
            threshold: params.threshold,
          }),
        };
        params.maskCallback(++numLoadedMasks);
      });

    // request arrow base
    const arrowRaw = await RequestWithProgress({
      method: "GET",
      path: DATA_BASE + `/${dataset}/${arrowFile}`,
      progressCallback: params.dataCallback,
      keepPath: true,
    });
    const arrow = tableFromIPC<ArrowSchema>(await arrowRaw.arrayBuffer());

    // wait for all requests to finish and return dataset
    Promise.all(maskPromises)
      .then(() => {
        const groupedLabelMasks = Object.fromEntries(
          Object.values(groups).map((group) => {
            let masks: LabelValueMask[];

            if (group.subgroups && group.subgroups.length > 0) {
              masks = group.subgroups.map((subgroup, i) => {
                const sg = groups[subgroup];
                return useLabelValueMask({
                  dataset,
                  name: sg.name,
                  key: sg.key,
                  value: i,
                  colour: sg.colour,
                  bitmask: or(...(sg.labels?.map((label) => maskBuffer[label].mask.bitmask.value) ?? [])) as Bitmask,
                });
              });
            } else if (group.labels && group.labels.length > 0) {
              masks = group.labels.map((label) => maskBuffer[label].mask);
            } else {
              throw new Error("Inconsistent data received!");
            }

            return [
              group.key,
              useLabelMaskGroup({
                dataset,
                key: group.key,
                name: group.name,
                type: group.type,
                masks,
              }),
            ];
          }),
        );

        resolve(
          useDataset<K>({
            info: params.info,
            labelMasks: groupedLabelMasks,
            arrow,
          }),
        );
      })
      .catch(reject);
  });
}
