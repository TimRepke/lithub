/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { DatasetDatabase } from './DatasetDatabase';
import type { DatasetInfo } from './DatasetInfo';

export type Dataset = {
  info: DatasetInfo;
  db: DatasetDatabase;
  key: string;
  secret?: string;
  has_tiles: boolean;
};

