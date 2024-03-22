import { type ReadonlyRef, AnnotatedDocument, ArrowSchema, DatasetInfo, Scheme } from "@/util/types";
import { type Bitmask, and, or, isNew } from "@/util/dataset/masks/bitmask.ts";
import { DATA_BASE, GETWithProgress, POST } from "@/util/api.ts";
import { type Ref, type ComputedRef, readonly, ref, toRef, watch, computed } from "vue";
import { type Table, tableFromIPC } from "apache-arrow";
import { useDatasetStore } from "@/stores/datasetstore.ts";
import { type HistogramMask, useHistogramMask } from "@/util/dataset/masks/histogram.ts";
import { None, useDelay } from "@/util/index.ts";
import { type IndexMask, useIndexMask } from "@/util/dataset/masks/ids.ts";
import {
  type LabelMaskGroup,
  type LabelValueMask,
  type MaskBufferEntry,
  loadLabelValueMask,
  useLabelMaskGroup,
} from "@/util/dataset/masks/labels.ts";
import { SearchMask, useSearchMask } from "@/util/dataset/masks/search.ts";
import { Counts } from "@/util/dataset/masks/base.ts";

// get filtered array from mask (like np.array([1,2,3,4])[[True, True, False, True]]
// Array.prototype.maskFilter = function(mask) {
//   return this.filter((item, i) => mask[i]);
// }
export type AnyMask = IndexMask | HistogramMask | LabelMaskGroup | SearchMask;

export interface Dataset {
  info: DatasetInfo;
  name: string;
  scheme: Scheme;
  arrow: Table<ArrowSchema>;
  counts: ReadonlyRef<Counts>;
  version: ReadonlyRef<number>;

  labelMaskGroups: Record<string, LabelMaskGroup>; // masks for all the annotations
  pyMask: HistogramMask; // masks for publication years
  indexMask: IndexMask; // mask for document ids (esp. for scatterplot)
  searchMask: SearchMask; // mask for title/abstract search (server-side filtering)
  // doiMask: SearchMask;// mask for DOI search (server-side filtering)

  bitmask: Ref<Bitmask | None>; // aggregate global mask
  inclusive: Ref<boolean>; // when true, use OR for combination, else AND

  masks(): Generator<AnyMask, void, any>;

  activeMasks(): Generator<AnyMask, void, any>;

  activeLabelMasks(): Generator<LabelValueMask, void, any>;

  activeBitmasks(): Generator<Bitmask | None, void, any>;

  activeLabelMaskColumns(): Generator<string, void, any>;

  documents(dparams: { ids?: string[] | null; page?: number; limit?: number }): Promise<AnnotatedDocument[]>;
}

export function useDataset(params: {
  info: DatasetInfo;
  name: string;
  scheme: Scheme;
  labelMasks: Record<string, LabelMaskGroup>;
  arrow: Table<ArrowSchema>;
  startYear: number;
  endYear: number;
}): Dataset {
  const inclusive = ref(true);
  const _counts = ref({
    countFiltered: params.arrow.numRows,
    countTotal: params.arrow.numRows,
  });
  const counts = readonly(_counts);
  const _version = ref(0);
  const version = readonly(_version);

  const pyYears = params.arrow.getChild("publication_year");
  if (!pyYears) throw new Error("Missing publication_years column in arrow file!");
  // @ts-ignore
  const pyMask = useHistogramMask(params.startYear, params.endYear, pyYears);
  const searchMask = useSearchMask(params.name);
  const indexMask = useIndexMask(params.arrow.numRows);

  const bitmask = ref<Bitmask | None>();

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
    yield searchMask;
    yield pyMask;
    yield indexMask;
  }

  function* activeMasks() {
    for (const mask of masks()) if (mask.active.value ?? mask.active) yield mask;
  }

  function* activeBitmasks() {
    for (const mask of activeMasks()) if (mask.bitmask.value) yield mask.bitmask.value;
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
    for (const mask of activeLabelMasks()) yield mask.column;
  }

  async function documents(dparams: {
    ids?: string[] | null;
    page?: number;
    limit?: number;
  }): Promise<AnnotatedDocument[]> {
    const orderBy = [...activeLabelMaskColumns()];
    const mask = (!dparams.ids || dparams.ids.length === 0) && hasActiveMask() ? bitmask.value?.toBase64() : undefined;
    return await POST<AnnotatedDocument[]>({
      path: `/basic/documents/${params.name}`,
      params: {
        limit: dparams.limit ?? 10,
        page: dparams.page ?? 0,
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
    name: params.name,
    scheme: params.scheme,
    arrow: params.arrow,
    counts: toRef(counts),
    version: toRef(version),
    inclusive: toRef(inclusive),
    pyMask,
    searchMask,
    indexMask,
    labelMaskGroups: params.labelMasks,
    bitmask: toRef(bitmask),
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
  numPages: ComputedRef<number>;
  pages: ComputedRef<number[]>;
  next: () => void;
  prev: () => void;
  hasPrev: ComputedRef<boolean>;
  hasNext: ComputedRef<boolean>;
}

export function useResults(): Results {
  const dataStore = useDatasetStore();
  const REQUEST_DELAY = 250;
  const MAX_PAGES = 8;

  const page = ref(0);
  const limit = ref(10);
  const documents = ref<AnnotatedDocument[]>([]);

  const { call: update, delayedCall: delayedUpdate } = useDelay(async () => {
    documents.value = await dataStore.dataset!.documents({ page: page.value, limit: limit.value });
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
    const total = dataStore.dataset?.counts.value.countFiltered;
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

  watch(dataStore.dataset!.version, delayedUpdate);
  watch([page, limit], update);

  return {
    documents: toRef(documents),
    page: toRef(page),
    limit: toRef(limit),
    numPages: toRef(numPages),
    pages: toRef(pages),
    hasPrev: toRef(hasPrev),
    hasNext: toRef(hasNext),
    next,
    prev,
  };
}

export async function loadDataset(params: {
  info: DatasetInfo;
  dataset: string;
  scheme: Scheme;
  arrowFile: string;
  maskCallback: (colsLoaded: number) => void;
  dataCallback: (bytesLoaded: number) => void;
  startYear: number;
  endYear: number;
}): Promise<Dataset> {
  return new Promise(async (resolve: (res: Dataset) => void, reject) => {
    // request all masks
    let numLoadedMasks = 0;
    const maskBuffer: Record<string, MaskBufferEntry> = {};
    const maskPromises = Object.entries(params.scheme) //
      .flatMap(([key, label]) =>
        label.values.map(async (value) => {
          if (!(key in maskBuffer))
            maskBuffer[key] = {
              key,
              name: label.name,
              type: label.type,
              masks: [],
            };
          maskBuffer[key].masks.push(
            await loadLabelValueMask({
              dataset: params.dataset,
              name: value.name,
              key,
              value: value.value,
              colour: value.colour,
            }),
          );
          params.maskCallback(++numLoadedMasks);
        }),
      );

    // request arrow base
    const arrowRaw = await GETWithProgress({
      path: DATA_BASE + `/${params.dataset}/${params.arrowFile}`,
      progressCallback: params.dataCallback,
    });
    const arrow = tableFromIPC<ArrowSchema>(arrowRaw);

    // wait for all requests to finish and return dataset
    Promise.all(maskPromises)
      .then(() => {
        const groupedLabelMasks = Object.fromEntries(
          Object.entries(maskBuffer).map(([key, entry]) => {
            return [
              key,
              useLabelMaskGroup({
                dataset: params.dataset,
                key: entry.key,
                name: entry.name,
                type: entry.type,
                masks: entry.masks,
              }),
            ];
          }),
        );

        resolve(
          useDataset({
            info: params.info,
            name: params.dataset,
            scheme: params.scheme,
            labelMasks: groupedLabelMasks,
            arrow,
            startYear: params.startYear,
            endYear: params.endYear,
          }),
        );
      })
      .catch(reject);
  });
}
