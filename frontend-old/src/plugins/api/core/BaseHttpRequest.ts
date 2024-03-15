import type { CancelablePromise } from "./CancelablePromise";
import { request as __request } from "./request";
import type { ApiRequestOptions } from "./ApiRequestOptions";
import type { OpenAPIConfig } from "./OpenAPI";

export class BaseHttpRequest {
  constructor(public readonly config: OpenAPIConfig) {}

  /**
   * Request method
   * @param options The request options from the service
   * @returns CancelablePromise<T>
   * @throws ApiError
   */
  public request<T>(options: ApiRequestOptions): CancelablePromise<T> {
    return __request<T>(this.config, options);
  }
}
