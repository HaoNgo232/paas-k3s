/**
 * Frontend Routes Constants
 * Centralized frontend route paths dùng cho redirect
 * Phải khớp với ROUTES trong frontend/src/lib/constants.ts
 */
export const FRONTEND_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CALLBACK: '/callback',
  DASHBOARD: '/dashboard',
} as const;

/**
 * Helper để build redirect URL
 * @param baseUrl - FRONTEND_URL từ config
 * @param path - Route path
 * @param params - Query parameters
 */
export function buildRedirectUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string>,
): string {
  const url = new URL(path, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}
