import { httpClient, HttpClient } from "@/lib/http";
import { ApiError } from "@/lib/http/errors";
import { User, ApiResponse } from "../types";
import { API_ENDPOINTS } from "@/lib/constants";

/**
 * Lớp dịch vụ xác thực (Auth Service Class)
 * Chứa logic nghiệp vụ cho các hoạt động xác thực (authentication operations)
 * Sử dụng mô hình Khởi tạo thông qua Dependency Injection (Constructor Injection Pattern)
 */
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Lấy thông tin người dùng hiện tại
   * @returns Hồ sơ người dùng (User profile)
   * @throws ApiError khi lệnh gọi API (API call) thất bại
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
   * Không chặn (Non-blocking): Nếu API gặp lỗi (fail), client vẫn sẽ xóa trạng thái (clear state)
   */
  async logout(): Promise<void> {
    try {
      await this.http.post<ApiResponse<null>>(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Bỏ qua lỗi - client sẽ xóa trạng thái cục bộ (local state) dù sao đi nữa
      // TODO: Triển khai dịch vụ ghi log lỗi (error logging service) phù hợp
    }
  }

  /**
   * Xác thực cấu trúc dữ liệu người dùng (Validate user data structure)
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
   * Kiểm tra xem token có hợp lệ không (xác thực cơ bản)
   * @param token JWT token
   * @returns boolean
   */
  isTokenValid(token: string): boolean {
    if (!token || token.trim() === "") return false;

    // Xác thực cấu trúc cơ bản của JWT (header.payload.signature)
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    try {
      // Giải mã payload để kiểm tra thời hạn sử dụng bằng API TextDecoder hiện đại
      const base64Url = parts[1];
      const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");

      // Chuyển đổi base64 sang byte rồi giải mã thành chuỗi UTF-8
      const binaryString = atob(base64);
      const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
      const jsonPayload = new TextDecoder().decode(bytes);

      const payload = JSON.parse(jsonPayload);
      if (!payload.exp) return true; // Không có tuyên bố hết hạn (expiration claim)

      const expirationTime = payload.exp * 1000; // Chuyển đổi sang mili giây
      return Date.now() < expirationTime;
    } catch {
      return false;
    }
  }
}

// Xuất phiên bản singleton với httpClient được inject
export const authService = new AuthService(httpClient);
