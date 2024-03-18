import { ArrowSchema, type ReadonlyRef, Scheme } from "@/util/types";
import { and, Bitmask, or } from "@/util/dataset/bitmask.ts";
import { DATA_BASE, GETWithProgress } from "@/util/api.ts";
import { readonly, Ref, ref, watch } from "vue";
import { Table, tableFromIPC } from "apache-arrow";
import { Counts, MaskBufferEntry } from "@/util/dataset/maskBase.ts";
import { LabelValueMask } from "@/util/dataset/masks.ts";
import { HistogramMask, IndexMask, LabelMaskGroup, SearchMask } from "@/util/dataset/groupMasks.ts";

// get filtered array from mask (like np.array([1,2,3,4])[[True, True, False, True]]
// Array.prototype.maskFilter = function(mask) {
//   return this.filter((item, i) => mask[i]);
// }

export async function loadDataset(params: {
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

export class Dataset {
  public readonly name: string;
  public readonly scheme: Scheme;

  public readonly arrow: Table<ArrowSchema>;

  public readonly counts: ReadonlyRef<Counts>;
  protected readonly _counts: Ref<Counts>;

  // masks for all the annotations
  public readonly labelMaskGroups: Record<string, LabelMaskGroup>;
  // masks for publication years
  public readonly pyMask: HistogramMask;
  // mask for document ids (esp. for scatterplot)
  public readonly indexMask: IndexMask;
  // mask for title/abstract search (server-side filtering)
  public readonly searchMask: SearchMask;
  // mask for DOI search (server-side filtering)
  // public readonly doiMask: SearchMask;
  // aggregate global mask
  private _mask: Bitmask | null;
  public readonly inclusive: Ref<boolean>; // when true, use OR for combination, else AND

  constructor(params: {
    name: string;
    scheme: Scheme;
    labelMasks: Record<string, LabelMaskGroup>;
    arrow: Table<ArrowSchema>;
    startYear: number;
    endYear: number;
  }) {
    this.name = params.name;
    this.scheme = params.scheme;

    this._counts = ref({
      countFiltered: params.arrow.numRows,
      countTotal: params.arrow.numRows,
    });
    this.counts = readonly(this._counts);

    this.arrow = params.arrow;
    const pyYears = this.arrow.getChild("publication_year");
    if (!pyYears) throw new Error("Missing publication_years column in arrow file!");
    // @ts-ignore
    this.pyMask = new HistogramMask(params.startYear, params.endYear, pyYears);
    this.searchMask = new SearchMask(params.name, ["title", "abstract"]);
    this.indexMask = new IndexMask(this.arrow.numRows);
    this.labelMaskGroups = params.labelMasks;

    this.inclusive = ref(true);

    this._mask = null;

    // TODO start fetching keywords file

    // set up watchers so we can bubble up changes
    watch(
      [...this.labelMasks()].map((mask) => mask.version),
      () => this.update(),
    );
    watch(this.inclusive, () => this.update());
  }

  get mask(): Bitmask | null {
    return this._mask;
  }

  *labelMasks() {
    for (const mask of Object.values(this.labelMaskGroups)) yield mask;
  }

  *masks() {
    for (const mask of Object.values(this.labelMaskGroups)) yield mask;
    // if (this.pyMask.active) yield this.pyMask;
    // if (this.indexMask.active) yield this.indexMask;
  }

  *activeMasks() {
    for (const mask of this.masks()) if (mask.active.value) yield mask;
  }

  *activeBitmasks() {
    for (const mask of this.activeMasks()) if (mask.mask) yield mask.mask;
  }

  private update() {
    this._mask = this.inclusive ? or(...this.activeBitmasks()) : and(...this.activeBitmasks());
    for (const mask of this.masks()) {
      mask.updateCounts(this._mask);
    }
    this._counts.value.countFiltered = this._mask?.count ?? this._counts.value.countTotal;
  }
}
