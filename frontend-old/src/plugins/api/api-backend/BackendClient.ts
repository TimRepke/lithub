/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from '@/plugins/api/core/BaseHttpRequest';
import type { OpenAPIConfig } from '@/plugins/api/core/OpenAPI';
import { AxiosHttpRequest } from '@/plugins/api/core/AxiosHttpRequest';

import { DataService } from './services/DataService';
import { DatasetsService } from './services/DatasetsService';
import { PingService } from './services/PingService';

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;

export class BackendClient {

  public readonly data: DataService;
  public readonly datasets: DatasetsService;
  public readonly ping: PingService;

  public readonly request: BaseHttpRequest;

  constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = AxiosHttpRequest) {
    this.request = new HttpRequest({
      BASE: config?.BASE ?? '',
      VERSION: config?.VERSION ?? '0.1.0',
      WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
      CREDENTIALS: config?.CREDENTIALS ?? 'include',
      TOKEN: config?.TOKEN,
      USERNAME: config?.USERNAME,
      PASSWORD: config?.PASSWORD,
      HEADERS: config?.HEADERS,
      ENCODE_PATH: config?.ENCODE_PATH,
    });

    this.data = new DataService(this.request);
    this.datasets = new DatasetsService(this.request);
    this.ping = new PingService(this.request);
  }
}

