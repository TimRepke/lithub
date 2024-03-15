/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type DatasetInfo = {
  name: string;
  description: string;
  type: DatasetInfo.type;
};

export namespace DatasetInfo {

  export enum type {
    DOCUMENTS = 'documents',
  }


}

