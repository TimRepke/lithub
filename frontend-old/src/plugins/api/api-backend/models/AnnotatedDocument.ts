/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type AnnotatedDocument = {
  doc_id: number;
  nacsos_id?: string;
  doi?: string;
  title: string;
  abstract?: string;
  year?: number;
  authors?: Array<string>;
  'x': number;
  'y': number;
  RowNum?: number;
  annotations?: Record<string, Array<string>>;
};

