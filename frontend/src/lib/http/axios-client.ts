import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";
import {
  HttpClient,
  HttpClientConfig,
  HttpResponse,
  RequestConfig,
} from "./http-client.interface";
import { ApiError } from "@/lib/http/errors";

/**
 * Cấu trúc phản hồi lỗi từ Backend
 */
interface BackendErrorResponse {
  message?: string;
  code?: string;
  statusCode?: number;
  error?: string;
  details?: unknown;
}

/**
 * Type guard để xác thực cấu trúc BackendErrorResponse.
 * Ngăn ngừa lỗi runtime khi backend trả về định dạng lỗi không mong muốn.
 */
function isBackendErrorResponse(data: unknown): data is BackendErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data)
  );
}

/**
 * Triển khai HTTP Client dựa trên Axios.
 * Thực thi interface HttpClient với Axios.
 */
export class AxiosHttpClient implements HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private authToken: string | null = null;

  constructor(config: HttpClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Bộ chặn (interceptor) request
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.authToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(this.handleError(error)),
    );

    // Bộ chặn (interceptor) response
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(this.handleError(error)),
    );
  }

  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data;

      // Xác thực an toàn cấu trúc phản hồi lỗi
      if (isBackendErrorResponse(errorData)) {
        return new ApiError(
          errorData.message || error.message,
          error.response?.status || 500,
          errorData.code || "UNKNOWN_ERROR",
          errorData,
        );
      }

      // Phương án dự phòng cho các phản hồi lỗi không chuẩn (HTML, văn bản thuần, v.v.)
      return new ApiError(
        error.message,
        error.response?.status || 500,
        "UNKNOWN_ERROR",
        errorData,
      );
    }
    return new ApiError("Unknown error occurred", 500, "UNKNOWN_ERROR");
  }

  private transformResponse<T>(response: AxiosResponse): HttpResponse<T> {
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  }

  async get<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    const response = await this.axiosInstance.get<T>(url, config);
    return this.transformResponse(response);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return this.transformResponse(response);
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return this.transformResponse(response);
  }

  async delete<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return this.transformResponse(response);
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }
}
