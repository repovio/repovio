import { useModuleApi as useQueryKitModuleApi } from '@querry-kit/nuxt/api';
import type { QueryParameters } from '@querry-kit/nuxt/types';
import type { AxiosResponse } from 'axios';

import { useApi } from '~/composables/api/api';
import type { Endpoint, Endpoints, QueryKitEndpoints } from '~/types/api/endpoints';

/** Paginated response shape returned by Query Kit resource endpoints. */
export interface PaginatedDto<TItem> {
  items: TItem[];
  meta: {
    itemCount: number;
    pageCount: number;
    [key: string]: unknown;
  };
}

type EndpointDto<TEndpoint extends Endpoint> = Endpoints[TEndpoint]['dto'];

type ModuleApi<TEndpoint extends Endpoint> = {
  /** Counts matching resources using the supplied query. */
  count(query?: QueryParameters): Promise<AxiosResponse<number>>;
  /** Creates module api. */
  create(data: Endpoints[TEndpoint]['create'], query?: QueryParameters): Promise<AxiosResponse<EndpointDto<TEndpoint>>>;
  /** Deletes module api. */
  delete(id: string | number, query?: QueryParameters): Promise<AxiosResponse<EndpointDto<TEndpoint>>>;
  /** Finds by id. */
  findById(id: string | number, query?: QueryParameters): Promise<AxiosResponse<EndpointDto<TEndpoint>>>;
  /** Retrieves module api. */
  get(id: string | number, query?: QueryParameters): Promise<AxiosResponse<EndpointDto<TEndpoint>>>;
  /** Fetches a resource page using the supplied filters, sorting, and pagination. */
  query(query?: QueryParameters): Promise<AxiosResponse<PaginatedDto<EndpointDto<TEndpoint>>>>;
  /** Updates module api. */
  update(
    id: string | number,
    data: Endpoints[TEndpoint]['update'],
    query?: QueryParameters,
  ): Promise<AxiosResponse<EndpointDto<TEndpoint>>>;
};

/** Provide a typed Query Kit resource client using Repovio's authenticated Axios client. */
export const useModuleApi = <TEndpoint extends Endpoint>(endpoint: TEndpoint): ModuleApi<TEndpoint> => {
  return useQueryKitModuleApi<QueryKitEndpoints, TEndpoint>(useApi(), endpoint) as ModuleApi<TEndpoint>;
};
