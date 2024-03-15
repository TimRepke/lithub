import { ReadonlyRef, SchemeLabelType } from "@/util/types";
import { and, Bitmask, or } from "@/util/dataset/bitmask.ts";
import { readonly, ref, type Ref, watch } from "vue";
import { Mask, MaskGroup } from "@/util/dataset/maskBase.ts";
import { request } from "@/util/api.ts";
import { LabelValueMask } from "@/util/dataset/masks.ts";

export class LabelMaskGroup extends MaskGroup {
  public readonly dataset: string;
  public readonly key: string;
  public readonly name: string;
  public readonly type: SchemeLabelType;
  public readonly masks: Record<number, LabelValueMask>;

  protected _mask: Bitmask | null; // holds all OR/AND combined submasks

  public readonly inclusive: Ref<boolean>;  // when true, use OR for combination, else AND

  constructor(dataset: string, key: string, name: string, type: SchemeLabelType, masks: LabelValueMask[]) {
    super();
    this.dataset = dataset;
    this.key = key;
    this.name = name;
    this.type = type;
    this.masks = Object.fromEntries(masks.map((mask) => [+mask.value, mask]));

    this.inclusive = ref(true);

    this._mask = this.getCombinedMasks();

    // set up watchers so we can bubble up changes
    watch(Object.values(this.masks).map(mask => mask.version), () => this.update());
    watch(this.inclusive, () => this.update());
  }

  get mask() {
    return this._mask;
  }

  protected getCombinedMasks() {
    // TODO think about the logic again...
    const masks = Object
      .values(this.masks)
      //.map((mask) => (mask.active) ? mask.mask : mask.mask.inverse);
      .filter((mask) => mask.active.value)
      .map((mask) => mask.mask);
    if (this.inclusive) return or(...masks);
    return and(...masks);
  }

  update() {
    this._mask = this.getCombinedMasks();
    this._version.value++;
  }

  updateCounts(globalMask: Bitmask | null) {
    Object.values(this.masks).forEach((mask) => {
      mask.updateCounts(globalMask);
    });
  }

}

export class SearchMask extends Mask {
  public static SEARCH_DELAY = 100;
  public static MIN_LEN = 3;
  private readonly dataset: string;
  private readonly fields: string[];
  public readonly search: Ref<string>;
  private _mask: Bitmask | null;
  private _delay: number | null;

  constructor(dataset: string, fields: string[]) {
    super();
    this.dataset = dataset;
    this.fields = fields;
    this.search = ref("");
    this._mask = null;
    this._delay = null;

    watch(this.search, this.fetchSearch);
  }

  get mask() {
    if (!this.active.value) return null;
    return this._mask;
  }

  async fetchSearch() {
    if (this.search.value.length <= SearchMask.MIN_LEN) {
      this._active.value = this.search.value.length >= SearchMask.MIN_LEN;
      // to not run update() here (no need to trigger a redraw when clearing the search bar)
      return;
    }
    if (this._delay !== null) clearTimeout(this._delay);
    // @ts-ignore
    this._delay = setTimeout(async () => {
      const rawMask = await request({
        method: "GET",
        path: `/basic/search/bitmask/${this.dataset}`,
        params: { search: this.search.value, fields: this.fields }
      });
      this._mask = Bitmask.fromBase64(await rawMask.text());
      this.update();
    }, SearchMask.SEARCH_DELAY);
  }

  clear() {
    this._active.value = false;
    this.search.value = "";
    this.update();
  }

  protected update(): void {
    this._active.value = this.search.value.length >= SearchMask.MIN_LEN;
    this._version.value++;
  }

  updateCounts(globalMask: Bitmask|null): void {
    if (this.mask !== null) {
      this._counts.value.countFiltered = and(globalMask, this.mask).count;
      this._counts.value.countTotal = this.mask.count;
    }
  }
}

export class IndexMask extends MaskGroup {
  protected readonly _ids: Ref<number[]>;
  public readonly ids: ReadonlyRef<number[]>;

  constructor(dataset: string, name: string, key: string, value: number | boolean, size: number) {
    super(dataset, name, key, value, new Bitmask(size));
    this._ids = ref([]);
    this.ids = readonly(this._ids);
  }

  selectIds(ids: number[]) {
    // TODO create bitmask from indexes
    this.update();
  }

  clear() {
    this._active.value = false;
    this.update();
  }
}

export class HistogramMask extends MaskGroup {
  protected readonly _ids: Ref<number[]>;
  public readonly ids: ReadonlyRef<number[]>;

  constructor(publicationYears: number[]) {
    // TODO make mask from years
    //      iterate list, spawn new bitmask when unseen year appears, populate bits as we go across different masks
    //      second pass to fill gaps
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
