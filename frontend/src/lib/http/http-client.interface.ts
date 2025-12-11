/**
 * HTTP Client Interface
 * Abstraction cho HTTP operations - dễ mock và test
 */

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HttpClient {
  get<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>>;
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>>;
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>>;
  delete<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>>;
  setAuthToken(token: string | null): void;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
}
