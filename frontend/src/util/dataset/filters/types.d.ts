import type { Ref } from "vue";
import type { Bitmask } from "@/util/dataset/filters/bitmask.ts";
import { None } from "@/util";
import { ReadonlyRef, SchemeLabelType } from "@/util/types";
import { AnyMask } from "@/util/dataset/wrappers/types";

export type Extent = [number, number];

export interface MaskParams {
  key: string;
  active?: boolean;
  bitmask?: Bitmask | null;
}

export interface Mask {
  key: string;
  active: Ref<boolean>;
  inverted: Ref<boolean>;
  version: Ref<number>;
  countTotal: ReadonlyRef<number>;
  countFiltered: ReadonlyRef<number>;
  bitmask: Ref<Bitmask | None>;
  setFilterCount: (c: number) => void;
  setTotalCount: (c: number) => void;
  setActive: (active: boolean) => void;
  toggleActive: () => void;
  toggleInvert: () => void;
  clear: () => void;
  update: () => void;
  updateCounts: (fullUpdate?: boolean) => void;
}

export interface FilterParams {
  key: string;
  masks: string[];
  subFilters?: string[];
  maskIndex: Index<AnyMask>;
  active?: boolean;
  inclusive?: boolean;
  type?: SchemeLabelType;
}

export interface Filter extends Mask {
  type: SchemeLabelType;
  inclusive: Ref<boolean>;
  masks: string[];
  subFilters: string[] | null;
  extentTotal: Ref<Extent>;
  extentFiltered: Ref<Extent>;
  // getCombinedMasks: () => Bitmask | None;
}

export interface Index<T extends Mask> {
  index: Record<string, T>;
  version: Ref<number>;
  update: () => void;
  register: (key: string, entry: T, quiet?: boolean) => void;
  unregister: (key: string) => void;
}
