import { type ReadonlyRef, Scheme } from "@/util/types";
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

export async function loadDataset(
  dataset: string,
  scheme: Scheme,
  arrowFile: string,
  maskCallback: (colsLoaded: number) => void,
  dataCallback: (bytesLoaded: number) => void,
): Promise<Dataset> {
  return new Promise(async (resolve: (res: Dataset) => void, reject) => {

    // request all masks
    let numLoadedMasks = 0;
    const maskBuffer: Record<string, MaskBufferEntry> = {};
    const maskPromises = Object
      .entries(scheme)
      .flatMap(
        ([key, label]) => label
          .values
          .map(async (value) => {
            if (!(key in maskBuffer)) maskBuffer[key] = {
              key,
              name: label.name,
              type: label.type,
              masks: [],
            };
            maskBuffer[key].masks.push(await LabelValueMask.loadMask(dataset, value.name, key, value.value));
            maskCallback(++numLoadedMasks);
          })
      );

    // request arrow base
    const arrowRaw = await GETWithProgress({
      path: DATA_BASE + `/${dataset}/${arrowFile}`,
      progressCallback: dataCallback,
    });
    const arrow = tableFromIPC(arrowRaw);

    // wait for all requests to finish and return dataset
    Promise
      .all(maskPromises)
      .then(() => {
          const groupedLabelMasks = Object.fromEntries(Object
            .entries(maskBuffer)
            .map(([key, entry]) => {
              return [
                key,
                new LabelMaskGroup(dataset, entry.key, entry.name, entry.type, entry.masks)
              ];
            })
          );

          resolve(new Dataset(dataset, scheme, groupedLabelMasks, arrow));
        }
      )
      .catch(reject);
  });
}

export class Dataset {
  public readonly name: string;
  public readonly scheme: Scheme;

  public readonly arrow: Table;

  public readonly counts: ReadonlyRef<Counts>;
  protected readonly _counts: Ref<Counts>;

  // masks for all the annotations
  public readonly labelMaskGroups: Record<string, LabelMaskGroup>;
  // masks for publication years
  public readonly pyMask: HistogramMask;
  // mask for document ids (esp. for scatterplot)
  public readonly indexMask: IndexMask;
  // mask for server-side filtering (esp. full-text search)
  public readonly searchMask: SearchMask;
  // aggregate global mask
  private _mask: Bitmask | null;
  public readonly inclusive: Ref<boolean>;  // when true, use OR for combination, else AND

  constructor(name: string, scheme: Scheme, labelMasks: Record<string, LabelMaskGroup>, arrow: Table) {
    this.name = name;
    this.scheme = scheme;

    this._counts = ref({
      countFiltered: arrow.numRows,
      countTotal: arrow.numRows,
    });
    this.counts = readonly(this._counts);

    this.labelMaskGroups = labelMasks;
    this.arrow = arrow;

    this.searchMask = new SearchMask(name, ["title", "abstract"]);

    this.inclusive = ref(true);

    this._mask = null;

    // TODO init histogram mask
    // TODO init index mask
    // TODO start fetching keywords file

    // set up watchers so we can bubble up changes
    watch([...this.labelMasks()].map(mask => mask.version), () => this.update());
    watch(this.inclusive, () => this.update());
  }

  get mask(): Bitmask | null {
    return this._mask;
  }

  * labelMasks() {
    for (let mask of Object.values(this.labelMaskGroups)) yield mask;
  }

  * masks() {
    for (let mask of Object.values(this.labelMaskGroups)) yield mask;
    // if (this.pyMask.active) yield this.pyMask;
    // if (this.indexMask.active) yield this.indexMask;
  }

  * activeMasks() {
    for (let mask of this.masks()) if (mask.active.value) yield mask;
  }

  * activeBitmasks() {
    for (let mask of this.activeMasks()) if (mask.mask) yield mask.mask;
  }

  private update() {
    this._mask = (this.inclusive) ? or(...this.activeBitmasks()) : and(...this.activeBitmasks());
    for (let mask of this.masks()) {
      mask.updateCounts(this._mask);
    }
    this._counts.value.countFiltered = this._mask?.count ?? this._counts.value.countTotal;
  }

}

