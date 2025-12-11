import { httpClient, HttpClient } from "@/lib/http";
import { ApiError } from "@/lib/http/errors";
import { User, ApiResponse } from "../types";
import { API_ENDPOINTS } from "@/lib/constants";

/**
 * Auth Service Class
 * Domain logic cho authentication operations
 * Sử dụng Constructor Injection Pattern
 */
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Lấy thông tin người dùng hiện tại
   * @returns User profile
   * @throws ApiError khi API call thất bại
   */
  async getMe(): Promise<User> {
    try {
      const response = await this.http.get<ApiResponse<User>>(
        API_ENDPOINTS.AUTH.ME,
      );

      if (!response.data.data) {
        throw new ApiError(
          "No user data returned from API",
          500,
          "USER_NOT_FOUND",
        );
      }

      return this.validateUser(response.data.data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Failed to fetch user profile",
        500,
        "FETCH_USER_FAILED",
      );
    }
  }

  /**
   * Đăng xuất khỏi hệ thống
   * Non-blocking: Nếu API fail, client vẫn clear state
   */
  async logout(): Promise<void> {
    try {
      await this.http.post<ApiResponse<null>>(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Ignore error - client sẽ clear local state dù sao
      // TODO: Implement proper error logging service
    }
  }

  /**
   * Validate user data structure
   * @private
   */
  private validateUser(user: User): User {
    if (!user.id || !user.email) {
      throw new ApiError(
        "Invalid user data structure",
        500,
        "INVALID_USER_DATA",
      );
    }
    return user;
  }

  /**
   * Check if token is valid (basic validation)
   * @param token JWT token
   * @returns boolean
   */
  isTokenValid(token: string): boolean {
    if (!token || token.trim() === "") return false;

    // Basic JWT structure validation (header.payload.signature)
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    try {
      // Decode payload to check expiration
      // Use decodeURIComponent + escape for Unicode-safe base64 decode
      const base64Url = parts[1];
      const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.codePointAt(0)!.toString(16)).slice(-2))
          .join(""),
      );

      const payload = JSON.parse(jsonPayload);
      if (!payload.exp) return true; // No expiration claim

      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expirationTime;
    } catch {
      return false;
    }
  }
}

// Export singleton instance với httpClient được inject
export const authService = new AuthService(httpClient);
