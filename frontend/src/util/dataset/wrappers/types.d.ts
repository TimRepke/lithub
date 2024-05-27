import type { Filter, Index, Mask } from "@/util/dataset/filters/types";
import type { ReadonlyRef, HSLColour } from "@/util/types";
import type { Ref } from "vue";

export interface HistogramMask extends Mask {
  year: number | null;
}

export interface HistogramFilter extends Filter {
  years: number[];
  selectRange: (begin: number, end: number) => void;
  selectYears: (years: number[]) => void;
}

export interface IndexMask extends Mask {
  ids: ReadonlyRef<number[]>;
  selectIds: (ids: number[]) => void;
}

export interface SearchMask extends Mask {
  fields: Ref<string[]>;
  search: Ref<string>;

  fetch: () => void;
  delayedFetch: () => void;
  clear: () => void;
}

export interface LabelMask extends Mask {
  name: string;
  value: number;
  colour: HSLColour;
  hexColour: string;
}

export interface LabelFilter extends Filter {}

export interface RegistrationParams {
  maskIndex: Index<AnyMask>;
  filterIndex: Index<AnyFilter>;
}

export type SpecialMask = SearchMask | LabelMask | IndexMask | HistogramMask;
export type AnyMask = Mask | SpecialMask;

export type SpecialFilter = LabelFilter | HistogramFilter;
export type AnyFilter = Filter | SpecialFilter;
