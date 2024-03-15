/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnnotatedDocument } from '../models/AnnotatedDocument';
import type { Document } from '../models/Document';
import type { SchemeInfo } from '../models/SchemeInfo';

import type { CancelablePromise } from '@/plugins/api/core/CancelablePromise';
import type { BaseHttpRequest } from '@/plugins/api/core/BaseHttpRequest';

import type { ApiRequestOptions } from '@/plugins/api/core/ApiRequestOptions';

export class DataService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Get Scheme With Numbers
   * @returns SchemeInfo Successful Response
   * @throws ApiError
   */
  public getSchemeWithNumbersApiDataDatasetSchemeGet({
    dataset,
    secret,
  }: {
    dataset: string,
    secret?: string,
  }, options?: Partial<ApiRequestOptions>): CancelablePromise<Array<SchemeInfo>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/data/{dataset}/scheme',
      path: {
        'dataset': dataset,
      },
      query: {
        'secret': secret,
      },
      errors: {
        422: `Validation Error`,
      },
      ...options,
    });
  }

  /**
   * Get Label Sample
   * @returns Document Successful Response
   * @throws ApiError
   */
  public getLabelSampleApiDataDatasetSampleLabelChoiceGet({
    dataset,
    label,
    choice,
    limit = 50,
    secret,
  }: {
    dataset: string,
    label: number,
    choice: number,
    limit?: number,
    secret?: string,
  }, options?: Partial<ApiRequestOptions>): CancelablePromise<Array<Document>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/data/{dataset}/sample/{label}/{choice}',
      path: {
        'dataset': dataset,
        'label': label,
        'choice': choice,
      },
      query: {
        'limit': limit,
        'secret': secret,
      },
      errors: {
        422: `Validation Error`,
      },
      ...options,
    });
  }

  /**
   * Get Label Paged
   * @returns Document Successful Response
   * @throws ApiError
   */
  public getLabelPagedApiDataDatasetPagedLabelChoiceGet({
    dataset,
    label,
    choice,
    page = 1,
    limit = 50,
    secret,
  }: {
    dataset: string,
    label: number,
    choice: number,
    page?: number,
    limit?: number,
    secret?: string,
  }, options?: Partial<ApiRequestOptions>): CancelablePromise<Array<Document>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/data/{dataset}/paged/{label}/{choice}',
      path: {
        'dataset': dataset,
        'label': label,
        'choice': choice,
      },
      query: {
        'page': page,
        'limit': limit,
        'secret': secret,
      },
      errors: {
        422: `Validation Error`,
      },
      ...options,
    });
  }

  /**
   * Get Abstract
   * @returns string Successful Response
   * @throws ApiError
   */
  public getAbstractApiDataDatasetAbstractDocIdGet({
    dataset,
    docId,
    secret,
  }: {
    dataset: string,
    docId: number,
    secret?: string,
  }, options?: Partial<ApiRequestOptions>): CancelablePromise<string> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/data/{dataset}/abstract/{doc_id}',
      path: {
        'dataset': dataset,
        'doc_id': docId,
      },
      query: {
        'secret': secret,
      },
      errors: {
        422: `Validation Error`,
      },
      ...options,
    });
  }

  /**
   * Get Info
   * @returns AnnotatedDocument Successful Response
   * @throws ApiError
   */
  public getInfoApiDataDatasetInfoDocIdGet({
    dataset,
    docId,
    secret,
  }: {
    dataset: string,
    docId: number,
    secret?: string,
  }, options?: Partial<ApiRequestOptions>): CancelablePromise<AnnotatedDocument> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/data/{dataset}/info/{doc_id}',
      path: {
        'dataset': dataset,
        'doc_id': docId,
      },
      query: {
        'secret': secret,
      },
      errors: {
        422: `Validation Error`,
      },
      ...options,
    });
  }

  /**
   * Get Data Paged
   * @returns Document Successful Response
   * @throws ApiError
   */
  public getDataPagedApiDataDatasetAllGet({
    dataset,
    page = 1,
    limit = 50,
    secret,
  }: {
    dataset: string,
    page?: number,
    limit?: number,
    secret?: string,
  }, options?: Partial<ApiRequestOptions>): CancelablePromise<Array<Document>> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/data/{dataset}/all',
      path: {
        'dataset': dataset,
      },
      query: {
        'page': page,
        'limit': limit,
        'secret': secret,
      },
      errors: {
        422: `Validation Error`,
      },
      ...options,
    });
  }

}
