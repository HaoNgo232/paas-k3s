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

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  checkAuth(): Promise<void>;
}
