/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type SchemeInfo = {
  scheme_id: number;
  label: string;
  description?: string;
  choices: Record<string, number>;
  s2i: Record<string, number>;
  i2s: Array<string>;
};

