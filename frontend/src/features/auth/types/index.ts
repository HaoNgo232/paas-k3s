/**
 * Auth Types
 * Định nghĩa các kiểu dữ liệu cho xác thực
 */

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum ServiceTier {
  FREE = "FREE",
  PRO = "PRO",
  TEAM = "TEAM",
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  tier: ServiceTier;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
