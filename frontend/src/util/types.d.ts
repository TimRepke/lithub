import { DeepReadonly, Ref } from "vue";
import { DataType, TypeMap } from "apache-arrow/type";
import { Type } from "apache-arrow/enum";

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

export type Scheme = Record<string, SchemeLabel>;

export interface DatasetInfo {
  name: string;
  teaser: string;
  description: string;

  total: number;
  key: string;
  columns: string[];

  authors?: string[] | null;
  contributors?: string[] | null;

  start_year: number;
  end_year: number;

  created_date: date;
  last_update: date;

  db_filename: string;
  arrow_filename: string;
  keywords_filename?: string | null;
  figure?: string | null;

  scheme: Scheme;
}

export interface ArrowSchema extends TypeMap {
  x: DataType<Type.Float16>;
  y: DataType<Type.Float16>;
  publication_year: DataType<Type.Uint16>;
}

export type ReadonlyRef<T> = DeepReadonly<Ref<T>>;
