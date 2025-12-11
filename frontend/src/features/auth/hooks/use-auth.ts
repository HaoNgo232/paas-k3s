import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { QUERY_KEYS, ROUTES } from "@/lib/constants";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized, setToken, clearToken, initialize } =
    useAuthStore();

  // Initialize store khi mount (chỉ chạy 1 lần)
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Query: Fetch User Profile
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.AUTH.ME,
    queryFn: () => authService.getMe(),
    enabled: isAuthenticated && isInitialized, // Chỉ fetch khi đã có token VÀ đã initialize
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000, // 10 phút (cacheTime renamed to gcTime trong v5)
  });

  // Mutation: Logout
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearToken();
      queryClient.clear(); // Clear toàn bộ cache
      router.push(ROUTES.LOGIN);
    },
    onError: (error) => {
      // Vẫn clear token nếu logout API lỗi (force logout)
      console.error("Logout mutation failed:", error);
      clearToken();
      queryClient.clear();
      router.push(ROUTES.LOGIN);
    },
  });

  const loginWithToken = useCallback(
    (token: string) => {
      setToken(token);
      // Fetch user profile ngay lập tức
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.ME });
    },
    [setToken, queryClient],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return {
    user: user ?? null,
    isLoading: isLoading && !isError,
    isInitialized,
    isAuthenticated: isAuthenticated && !isError,
    error: isError ? error : null,
    loginWithToken,
    logout,
  };
}
