import type { ReadonlyRef, SchemeLabelType } from "@/util/types";
import { LabelValueMask } from "@/util/dataset/masks.ts";
import type { Ref } from "vue";
import { readonly, ref, watch } from "vue";
import type { Bitmask } from "@/util/dataset/bitmask.ts";

export interface MaskBufferEntry {
  key: string;
  name: string;
  type: SchemeLabelType;
  masks: LabelValueMask[];
}

export type Counts = {
  countTotal: number;
  countFiltered: number;
};

export interface MaskBase {
  active: Ref<boolean>;
  version: ReadonlyRef<number>;

  setActive(active: boolean): void;

  toggleActive(): void;

  update(): void;
}
export interface Mask extends MaskBase {
  counts: ReadonlyRef<Counts>;

  get mask(): Bitmask | null;

  updateCounts(globalMask: Bitmask | null): void;
}
const a = {
   bla: () => {
    return '';
  },
}