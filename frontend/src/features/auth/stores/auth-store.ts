import { create } from "zustand";
import { storage } from "@/lib/storage";
import { httpClient } from "@/lib/http";
import { STORAGE_KEYS } from "@/lib/constants";
import { authService } from "@/features/auth/services/auth.service";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  initialize: () => void;
}

/**
 * Auth Store
 * Client state management với Zustand
 * Sử dụng Storage Abstraction thay vì direct Cookies
 */
export const useAuthStore = create<AuthState>((set, _get) => ({
  token: null,
  isAuthenticated: false,
  isInitialized: false,

  initialize: () => {
    const token = storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (token && authService.isTokenValid(token)) {
      httpClient.setAuthToken(token);
      set({ token, isAuthenticated: true, isInitialized: true });
    } else {
      // Token invalid hoặc không tồn tại
      storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      httpClient.setAuthToken(null);
      set({ token: null, isAuthenticated: false, isInitialized: true });
    }
  },

  setToken: (token: string) => {
    // Validate token trước khi lưu
    if (!authService.isTokenValid(token)) {
      console.error("Attempted to set invalid token");
      return;
    }

    storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token, {
      expires: 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    httpClient.setAuthToken(token);
    set({ token, isAuthenticated: true });
  },

  clearToken: () => {
    storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    httpClient.setAuthToken(null);
    set({ token: null, isAuthenticated: false });
  },
}));
