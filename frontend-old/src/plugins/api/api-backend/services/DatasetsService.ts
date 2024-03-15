/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Dataset } from '../models/Dataset';

import type { CancelablePromise } from '@/plugins/api/core/CancelablePromise';
import type { BaseHttpRequest } from '@/plugins/api/core/BaseHttpRequest';

import type { ApiRequestOptions } from '@/plugins/api/core/ApiRequestOptions';

export class DatasetsService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Get Dataset
   * @returns Dataset Successful Response
   * @throws ApiError
   */
  public getDatasetApiDatasetsDatasetGet({
    dataset,
  }: {
    dataset: string,
  }, options?: Partial<ApiRequestOptions>): CancelablePromise<Dataset> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/datasets/{dataset}',
      path: {
        'dataset': dataset,
      },
      errors: {
        422: `Validation Error`,
      },
      ...options,
    });
  }

  /**
   * Get Datasets
   * @returns Dataset Successful Response
   * @throws ApiError
   */
  public getDatasetsApiDatasetsGet(options?: Partial<ApiRequestOptions>): CancelablePromise<Array<Dataset>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/datasets/',
      ...options,
    });
  }

  /**
   * Reload Datasets
   * @returns Dataset Successful Response
   * @throws ApiError
   */
  public reloadDatasetsApiDatasetsPut(options?: Partial<ApiRequestOptions>): CancelablePromise<Array<Dataset>> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/api/datasets/',
      ...options,
    });
  }

}
