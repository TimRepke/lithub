import { AnnotatedDocument, ArrowSchema, DatasetInfo, type ReadonlyRef, Scheme } from "@/util/types";
import { and, Bitmask, or } from "@/util/dataset/bitmask.ts";
import { DATA_BASE, GETWithProgress, POST } from "@/util/api.ts";
import { computed, ComputedRef, readonly, Ref, ref, watch } from "vue";
import { Table, tableFromIPC } from "apache-arrow";
import { Counts, MaskBufferEntry } from "@/util/dataset/maskBase.ts";
import { LabelValueMask } from "@/util/dataset/masks.ts";
import { HistogramMask, IndexMask, LabelMaskGroup, SearchMask } from "@/util/dataset/groupMasks.ts";
import { useDatasetStore } from "@/stores/datasetstore.ts";

// get filtered array from mask (like np.array([1,2,3,4])[[True, True, False, True]]
// Array.prototype.maskFilter = function(mask) {
//   return this.filter((item, i) => mask[i]);
// }

export class Dataset {
  public readonly info: DatasetInfo;
  public readonly name: string;
  public readonly scheme: Scheme;

  public readonly arrow: Table<ArrowSchema>;

  public readonly counts: ReadonlyRef<Counts>;
  protected readonly _counts: Ref<Counts>;

  public readonly version: ReadonlyRef<number>;
  protected readonly _version: Ref<number>;
  public readonly v: Ref<{ version: number }>;
  // masks for all the annotations
  public readonly labelMaskGroups: Record<string, LabelMaskGroup>;
  // masks for publication years
  public readonly pyMask: HistogramMask;
  // mask for document ids (esp. for scatterplot)
  public readonly indexMask: IndexMask;
  // mask for title/abstract search (server-side filtering)
  public searchMask: SearchMask;
  // mask for DOI search (server-side filtering)
  // public readonly doiMask: SearchMask;
  // aggregate global mask
  private _mask: Bitmask | null;
  public readonly inclusive: Ref<boolean>; // when true, use OR for combination, else AND

  constructor(params: {
    info: DatasetInfo;
    name: string;
    scheme: Scheme;
    labelMasks: Record<string, LabelMaskGroup>;
    arrow: Table<ArrowSchema>;
    startYear: number;
    endYear: number;
  }) {
    this.info = params.info;
    this.name = params.name;
    this.scheme = params.scheme;

    this._counts = ref({
      countFiltered: params.arrow.numRows,
      countTotal: params.arrow.numRows,
    });
    this.counts = readonly(this._counts);

    this._version = ref(0);
    this.v = ref({ version: 0 });
    this.version = readonly(this._version);

    this.arrow = params.arrow;
    const pyYears = this.arrow.getChild("publication_year");
    if (!pyYears) throw new Error("Missing publication_years column in arrow file!");
    // @ts-ignore
    this.pyMask = new HistogramMask(params.startYear, params.endYear, pyYears);
    this.searchMask = new SearchMask(params.name);
    this.indexMask = new IndexMask(this.arrow.numRows);
    this.labelMaskGroups = params.labelMasks;

    this.inclusive = ref(true);

    this._mask = null;

    // TODO start fetching keywords file

    // set up watchers so we can bubble up changes
    watch(
      [...this.masks()].map((mask) => mask.version),
      () => this.update(),
    );
    watch(this.inclusive, () => this.update());
  }

  get mask(): Bitmask | null {
    return this._mask;
  }

  get hasActiveMask(): boolean {
    return [...this.activeMasks()].length > 0;
  }

  * masks() {
    for (const mask of Object.values(this.labelMaskGroups)) yield mask;
    yield this.searchMask;
    yield this.pyMask;
    yield this.indexMask;
  }

  * activeMasks() {
    for (const mask of this.masks()) if (mask.active.value ?? mask.active) yield mask;
  }

  * activeBitmasks() {
    for (const mask of this.activeMasks()) if (mask.mask) yield mask.mask;
  }

  private update() {
    this._mask = this.inclusive.value ? or(...this.activeBitmasks()) : and(...this.activeBitmasks());
    for (const mask of this.masks()) {
      mask.updateCounts(this._mask);
    }
    this._counts.value.countFiltered = this._mask?.count ?? this._counts.value.countTotal;
    this._version.value += 1;
    this.v.value.version += 1;
  }

  * activeLabelMasks() {
    for (const mask of Object.values(this.labelMaskGroups)) {
      if (mask.active.value) {
        for (const labelMask of Object.values(mask.masks)) {
          if (labelMask.active.value) {
            yield labelMask;
          }
        }
      }
    }
  }

  * activeLabelMaskColumns() {
    for (const mask of this.activeLabelMasks()) yield mask.column;
  }

  async documents(params: { ids?: string[] | null; page?: number; limit?: number }): Promise<AnnotatedDocument[]> {
    const orderBy = [...this.activeLabelMaskColumns()];
    const mask = (!params.ids || params.ids.length === 0) && this.hasActiveMask ? this.mask?.toBase64() : undefined;
    return await POST<AnnotatedDocument[]>({
      path: `/basic/documents/${this.name}`,
      params: {
        limit: params.limit ?? 10,
        page: params.page ?? 0,
      },
      payload: {
        ids: params.ids,
        bitmask: mask,
        order_by: orderBy,
      },
    });
  }
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

  let delay: number | null = null;
  const page = ref(0);
  const limit = ref(10);
  const documents = ref<AnnotatedDocument[]>([]);

  watch(dataStore.dataset!.v, () => delayedUpdate());
  watch([page, limit], update);

  async function update() {
    if (delay !== null) clearTimeout(delay);
    documents.value = await dataStore.dataset!.documents({ page: page.value, limit: limit.value });
    return documents.value;
  }

  const hasNext = computed(() => page.value < numPages.value - 1);

  function next() {
    if (hasNext.value) page.value += 1;
  }

  const hasPrev = computed(() => page.value > 0);

  function prev() {
    if (hasPrev.value) page.value -= 1;
  }

  function delayedUpdate() {
    if (delay !== null) clearTimeout(delay);
    // @ts-ignore
    delay = setTimeout(async () => {
      page.value = 0;
      await update();
    }, REQUEST_DELAY);
  }

  const numPages = computed(() => {
    const total = dataStore.dataset?.counts.countFiltered;
    return Math.ceil((total ?? 0) / limit.value);
  });
  const pages = computed(() => {
    const firstPage = Math.max(0, page.value - MAX_PAGES / 2);
    return [...Array(Math.min(MAX_PAGES, numPages.value)).keys()].map((p) => p + firstPage);
  });

  return {
    documents,
    page,
    limit,
    numPages,
    pages,
    next,
    prev,
    hasPrev,
    hasNext,
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
          maskBuffer[key].masks.push(await LabelValueMask.loadMask(params.dataset, value.name, key, value.value));
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
            return [key, new LabelMaskGroup(params.dataset, entry.key, entry.name, entry.type, entry.masks)];
          }),
        );

        resolve(
          new Dataset({
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
