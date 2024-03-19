import { readonly, ref, type Ref, watch } from "vue";
import { type Bitmask } from "@/util/dataset/bitmask.ts";
import type { ReadonlyRef, SchemeLabelType } from "@/util/types";
import { LabelValueMask } from "@/util/dataset/masks.ts";

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
  public readonly active: Ref<boolean>; // true, iff items shall be included, false for exclusion

  protected readonly _version: Ref<number>;
  public readonly version: ReadonlyRef<number>;

  protected constructor() {
    this.active = ref(false);

    this._version = ref(0);
    this.version = readonly(this._version);

    watch(this.active, () => {
      this.update();
    });
  }

  setActive(active: boolean) {
    this.active.value = active;
    this.update();
  }

  toggleActive() {
    this.active.value = !this.active.value;
    this.update();
  }

  abstract update(): void;
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

  abstract updateCounts(globalMask: Bitmask | null): void;
}

export abstract class MaskGroup extends MaskBase {
  abstract get mask(): Bitmask | null;

  abstract updateCounts(globalMask: Bitmask | null): void;
}

export function colKey(key: string, value: number | boolean) {
  return `${key}|${+value}`;
}
