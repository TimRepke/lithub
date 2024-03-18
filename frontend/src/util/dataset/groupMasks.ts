import { ReadonlyRef, SchemeLabelType } from "@/util/types";
import { and, Bitmask, or } from "@/util/dataset/bitmask.ts";
import { readonly, ref, type Ref, watch } from "vue";
import { Mask, MaskGroup } from "@/util/dataset/maskBase.ts";
import { request } from "@/util/api.ts";
import { HistogramValueMask, LabelValueMask } from "@/util/dataset/masks.ts";
import type { Vector } from "apache-arrow/vector";
import { DataType } from "apache-arrow/type";
import { Type } from "apache-arrow/enum";

export class LabelMaskGroup extends MaskGroup {
  public readonly dataset: string;
  public readonly key: string;
  public readonly name: string;
  public readonly type: SchemeLabelType;
  public readonly masks: Record<number, LabelValueMask>;

  protected _mask: Bitmask | null; // holds all OR/AND combined submasks

  public readonly inclusive: Ref<boolean>; // when true, use OR for combination, else AND

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
    watch(
      Object.values(this.masks).map((mask) => mask.version),
      () => this.update(),
    );
    watch(this.inclusive, () => this.update());
  }

  get mask() {
    return this._mask;
  }

  protected getCombinedMasks() {
    // TODO think about the logic again...
    const masks = Object.values(this.masks)
      //.map((mask) => (mask.active) ? mask.mask : mask.mask.inverse);
      // .filter((mask) => mask.active.value)
      .map((mask) => (mask.active.value ? mask.mask : null));
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
        params: { search: this.search.value, fields: this.fields },
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

  updateCounts(globalMask: Bitmask | null): void {
    if (this.mask !== null) {
      this._counts.value.countTotal = this.mask.count;
      this._counts.value.countFiltered = and(globalMask, this.mask)?.count ?? this._counts.value.countTotal;
    }
  }
}

export class HistogramMask extends MaskGroup {
  public readonly years: number[];
  public readonly masks: Record<number, HistogramValueMask>;
  public readonly restMask: HistogramValueMask;

  private _mask: Bitmask | null; // holds all OR/AND combined submasks

  constructor(startYear: number, endYear: number, col: Vector<DataType<Type.Uint16>>) {
    super();
    const diff = endYear - startYear;
    this.years = [...Array(diff).keys()].map((i) => i + diff);

    const masks: Record<number, Bitmask> = Object.fromEntries(this.years.map((yr) => [yr, new Bitmask(col.length)]));
    const restMask = new Bitmask(col.length); // includes items not in the year range
    let yr;
    for (let i = 0; i < col.length; i++) {
      yr = col.get(i);
      if (yr in masks) masks[yr].set(i);
      else restMask.set(i);
    }
    this.masks = Object.fromEntries(Object.entries(masks).map(([yr, mask]) => [yr, new HistogramValueMask(mask, +yr)]));
    this.restMask = new HistogramValueMask(restMask);
    this._mask = null;
  }

  get mask() {
    return this._mask;
  }

  selectRange(begin: number, end: number) {
    Object.entries(this.masks).forEach(([yr, mask]) => mask.setActive(+yr >= begin && +yr <= end));
    this.restMask.setActive(false);
    this.update();
  }

  selectYears(years: number[]) {
    Object.entries(this.masks).forEach(([yr, mask]) => mask.setActive(years.indexOf(+yr) >= 0));
    this.restMask.setActive(false);
    this.update();
  }

  protected getCombinedMasks() {
    const masks = Object.values(this.masks).map((mask) => (mask.active.value ? mask.mask : null));
    // TODO: We are always ignoring the restMask. Kind of makes sense, but might need to be reconsidered.
    return or(...masks);
  }

  clear() {
    this._active.value = false;
    Object.values(this.masks).forEach((mask) => mask.clear());
    this.restMask.clear();
    this.update();
  }

  update() {
    this._mask = this.getCombinedMasks();
    this._version.value++;
  }

  updateCounts(globalMask: Bitmask | null) {
    Object.values(this.masks).forEach((mask) => {
      mask.updateCounts(globalMask);
    });
    this.restMask.updateCounts(globalMask);
  }
}

export class IndexMask extends Mask {
  protected readonly _ids: Ref<number[]>;
  public readonly ids: ReadonlyRef<number[]>;

  private readonly _mask: Bitmask;

  constructor(length: number) {
    super();
    this._ids = ref([]);
    this.ids = readonly(this._ids);
    this._mask = new Bitmask(length);
  }

  selectIds(ids: number[]) {
    this._mask.reset();
    for (const idx of ids) {
      this._mask.set(idx);
    }
    this._ids.value = ids;
    this._active.value = true;
    this.update();
  }

  clear() {
    this._active.value = false;
    this._ids.value = [];
    this._mask.reset();
    this.update();
  }

  get mask(): Bitmask | null {
    return this._mask;
  }

  protected update(): void {
    this._version.value++;
  }

  updateCounts(globalMask: Bitmask | null): void {
    this._counts.value.countTotal = this._ids.value.length;
    if (!globalMask) {
      this._counts.value.countFiltered = this._counts.value.countTotal;
    } else {
      this._counts.value.countFiltered = and(this.mask, globalMask)?.count ?? this._counts.value.countTotal;
    }
  }
}
