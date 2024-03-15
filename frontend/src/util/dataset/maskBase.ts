import { readonly, ref, type Ref } from "vue";
import { type Bitmask } from "@/util/dataset/bitmask.ts";
import type { ReadonlyRef, SchemeLabelType } from "@/util/types";
import { LabelValueMask } from "@/util/dataset/masks.ts";

export type MaskMap = Record<number, Mask>;

export interface MaskBufferEntry {
  key: string;
  name: string;
  type: SchemeLabelType;
  masks: LabelValueMask[];
}

export interface Counts {
  countTotal: number;
  countFiltered: number;
}

export abstract class MaskBase {

  protected readonly _active: Ref<boolean>;  // true, iff items shall be included, false for exclusion
  public readonly active: ReadonlyRef<boolean>;

  protected readonly _version: Ref<number>;
  public readonly version: ReadonlyRef<number>;

  protected constructor() {
    this._active = ref(false);
    this.active = readonly(this._active);

    this._version = ref(0);
    this.version = readonly(this._version);
  }

  setActive(active: boolean) {
    this._active.value = active;
    this.update();
  }

  toggleActive() {
    this._active.value = !this._active.value;
    this.update();
  }

  protected abstract update(): void;
}

export abstract class Mask extends MaskBase {
  public readonly counts: ReadonlyRef<Counts>;
  protected readonly _counts: Ref<Counts>;

  protected constructor() {
    super();
    this._counts = ref({
      countFiltered: 0,
      countTotal: 0,
    });
    this.counts = readonly(this._counts);
  }

  abstract get mask(): Bitmask | null;

  abstract updateCounts(globalMask: Bitmask| null): void;
}

export abstract class MaskGroup extends MaskBase {
  abstract get mask(): Bitmask | null;

  abstract updateCounts(globalMask: Bitmask | null): void;
}

export function colKey(key: string, value: number | boolean) {
  return `${key}|${+value}`;
}

