import { DeepReadonly, Ref } from "vue";

export interface SchemeLabelValue {
  name: string;
  value: boolean | number;
}

export type SchemeLabelType = "single" | "bool" | "multi";

export interface SchemeLabel {
  name: string;
  key: string;
  type: SchemeLabelType;
  values: SchemeLabelValue[];
}
export type Scheme=Record<string, SchemeLabel>;
export interface DatasetInfo {
  name: string;
  teaser: string;
  description: string;

  total: number;
  key: string;
  columns: string[];

  authors?: string[] | null;
  contributors?: string[] | null;

  created_date: date;
  last_update: date;

  db_filename: string;
  arrow_filename: string;
  keywords_filename?: string | null;
  figure?: string | null;

  scheme: Scheme;
}

export type ReadonlyRef<T> = DeepReadonly<Ref<T>>;