/**
 * Auth Types
 * Định nghĩa các kiểu dữ liệu cho xác thực
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
