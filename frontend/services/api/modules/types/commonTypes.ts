/**
 * Common type definitions shared across API modules
 */

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
  error?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface SortParams {
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams, SortParams {
  query?: string;
  filters?: Record<string, any>;
}

export interface CountResponse {
  count: number;
}

export interface StatusResponse {
  status: boolean;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode?: number;
}

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  credentials?: 'include' | 'omit' | 'same-origin';
}; 