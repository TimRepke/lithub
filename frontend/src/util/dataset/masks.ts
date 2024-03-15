import { readonly, ref, Ref } from "vue";
import { and, Bitmask } from "@/util/dataset/bitmask.ts";
import { colKey, Mask } from "@/util/dataset/maskBase.ts";
import { request } from "@/util/api.ts";
import { ReadonlyRef } from "@/util/types";

const DEFAULT_THRESHOLD = 0.5;

export class LabelValueMask extends Mask {
  public readonly dataset: string;
  public readonly name: string;
  public readonly key: string;
  public readonly value: number | boolean;
  public readonly column: string;

  protected readonly _threshold: Ref<number>;
  public readonly threshold: ReadonlyRef<number>;
  protected _mask: Bitmask|null;

  constructor(dataset: string, name: string, key: string, value: number | boolean, mask: Bitmask) {
    super();
    this._threshold = ref(DEFAULT_THRESHOLD);
    this.threshold = readonly(this._threshold);
    this.dataset = dataset;
    this.name = name;
    this.key = key;
    this.value = value;
    this.column = colKey(key, value);

    this._mask = mask;

    const count = mask.count;
    this._counts.value.countFiltered = count;
    this._counts.value.countTotal = count;
  }

  get mask() {
    return this._mask;
  }

  static async loadMask(dataset: string, name: string, key: string, value: number | boolean) {
    const col = colKey(key, value);
    const mask = await loadMask(dataset, col, DEFAULT_THRESHOLD);
    return new LabelValueMask(dataset, name, key, value, mask);
  }

  async setThreshold(threshold: number | null = null) {
    if (threshold !== null) this._threshold.value = threshold;
    this._mask = await loadMask(this.dataset, this.column, this._threshold.value);
    this.update();
  }

  protected update() {
    this._version.value++;
  }

  updateCounts(globalMask: Bitmask) {
    this._counts.value.countFiltered = this.active ? and(globalMask, this.mask).count : 0;
  }
}

export class HistogramValueMask extends Mask {
  protected readonly _ids: Ref<number[]>;
  public readonly ids: ReadonlyRef<number[]>;

  constructor(publicationYears: number[]) {
    // TODO make mask from years

    super();
    this._ids = ref([]);
    this.ids = readonly(this._ids);
  }

  get mask() {
    // TODO
  }

  selectRange(begin: number, end: number) {
    // TODO set all years active between begin and end
  }

  selectYears(ids: number[]) {
    // TODO create bitmask from indexes
    this.update();
  }

  clear() {
    this._active.value = false;
    this.update();
  }

  protected update(): void {
  }

  updateCounts(globalMask: Bitmask): void {
  }
}


function loadMask(dataset: string, col: string, threshold: number = 0.5) {
  return new Promise((resolve: (mask: Bitmask) => void, reject) => {
    request({
      method: "GET",
      path: `/basic/bitmask/${dataset}`,
      params: { key: col, min_score: threshold }
    })
      .then(async (result) => {
        resolve(Bitmask.fromBase64(await result.text()));
      })
      .catch(reject);
  });
}
