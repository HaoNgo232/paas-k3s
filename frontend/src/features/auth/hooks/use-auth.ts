"use client";

import React, { createContext, useContext } from "react";
import { AuthContextType, User } from "../types";

/**
 * Auth Context
 * Cung cấp trạng thái xác thực cho toàn bộ ứng dụng
 */
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

/**
 * useAuth Hook
 * Hook để sử dụng Auth Context
 * @throws Error nếu được sử dụng bên ngoài AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * useUser Hook
 * Hook để lấy thông tin người dùng hiện tại
 */
export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

/**
 * useIsAuthenticated Hook
 * Hook để kiểm tra xem người dùng có được xác thực hay không
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
