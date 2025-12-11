import { AxiosHttpClient } from "@/lib/http/axios-client";

/**
 * HTTP Client Factory
 * Singleton pattern - tạo 1 instance duy nhất và tái sử dụng
 *
 * Lợi ích:
 * - Tiết kiệm memory (chỉ 1 instance)
 * - Dễ mock khi testing (resetInstance)
 * - Centralized configuration
 */
class HttpClientFactory {
  private static instance: AxiosHttpClient;

  /**
   * Lấy hoặc tạo HTTP client instance
   * Lazy initialization - chỉ tạo khi cần
   */
  static getInstance(): AxiosHttpClient {
    if (!this.instance) {
      this.instance = new AxiosHttpClient({
        baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
        timeout: 30000,
      });
    }
    return this.instance;
  }

  /**
   * Reset instance - dùng cho testing
   */
  static resetInstance(): void {
    this.instance = null as unknown as AxiosHttpClient;
  }
}

/**
 * Singleton instance - import này ở mọi service
 * Usage: import { httpClient } from '@/lib/http'
 */
export const httpClient = HttpClientFactory.getInstance();

/**
 * Export factory nếu cần custom instance
 * (Ví dụ: mock khi testing)
 */
export { HttpClientFactory };

/**
 * Export interface để type annotation
 * Usage: constructor(private readonly http: HttpClient)
 */
export type { HttpClient } from "./http-client.interface";
