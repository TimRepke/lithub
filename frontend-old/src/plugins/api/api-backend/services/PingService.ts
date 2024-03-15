/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '@/plugins/api/core/CancelablePromise';
import type { BaseHttpRequest } from '@/plugins/api/core/BaseHttpRequest';

import type { ApiRequestOptions } from '@/plugins/api/core/ApiRequestOptions';

export class PingService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   *  Pong
   * @returns string Successful Response
   * @throws ApiError
   */
  public pongApiPingGet(options?: Partial<ApiRequestOptions>): CancelablePromise<string> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/ping/',
      ...options,
    });
  }

  /**
   *  Err
   * @returns string Successful Response
   * @throws ApiError
   */
  public errApiPingErrorGet(options?: Partial<ApiRequestOptions>): CancelablePromise<string> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/ping/error',
      ...options,
    });
  }

  /**
   *  Warn
   * @returns string Successful Response
   * @throws ApiError
   */
  public warnApiPingWarnGet(options?: Partial<ApiRequestOptions>): CancelablePromise<string> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/ping/warn',
      ...options,
    });
  }

  /**
   *  Warn2
   * @returns string Successful Response
   * @throws ApiError
   */
  public warn2ApiPingWarn2Get(options?: Partial<ApiRequestOptions>): CancelablePromise<string> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/ping/warn2',
      ...options,
    });
  }

  /**
   *  Ping
   * @returns string Successful Response
   * @throws ApiError
   */
  public pingApiPingNamePost({
    name,
  }: {
    name: string,
  }, options?: Partial<ApiRequestOptions>): CancelablePromise<string> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/ping/{name}',
      path: {
        'name': name,
      },
      errors: {
        422: `Validation Error`,
      },
      ...options,
    });
  }

}
