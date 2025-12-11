/**
 * Application Routes
 * Centralized route constants
 */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  CALLBACK: "/callback",
  DASHBOARD: "/dashboard",
  SPACES: "/spaces",
  PROJECTS: "/projects",
  SERVICES: "/services",
  MONITORING: "/monitoring",
  SETTINGS: "/settings",
  ADMIN: {
    ROOT: "/admin",
    USERS: "/admin/users",
    PLATFORM: "/admin/platform",
  },
} as const;

/**
 * API Endpoints
 * Centralized API endpoint constants
 */
export const API_ENDPOINTS = {
  AUTH: {
    ME: "/auth/me",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    GITHUB: "/auth/github",
    GITHUB_CALLBACK: "/auth/github/callback",
  },
  SPACES: {
    LIST: "/spaces",
    CREATE: "/spaces",
    GET: (id: string) => `/spaces/${id}`,
    UPDATE: (id: string) => `/spaces/${id}`,
    DELETE: (id: string) => `/spaces/${id}`,
  },
  PROJECTS: {
    LIST: (spaceId: string) => `/spaces/${spaceId}/projects`,
    CREATE: (spaceId: string) => `/spaces/${spaceId}/projects`,
    GET: (spaceId: string, projectId: string) =>
      `/spaces/${spaceId}/projects/${projectId}`,
  },
} as const;

/**
 * Storage Keys
 * Centralized storage key constants
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER_PREFERENCES: "userPreferences",
} as const;

/**
 * Query Keys
 * Centralized React Query key constants
 */
export const QUERY_KEYS = {
  AUTH: {
    ME: ["auth", "me"] as const,
  },
  SPACES: {
    LIST: ["spaces"] as const,
    DETAIL: (id: string) => ["spaces", id] as const,
  },
  PROJECTS: {
    LIST: (spaceId: string) => ["projects", spaceId] as const,
    DETAIL: (spaceId: string, projectId: string) =>
      ["projects", spaceId, projectId] as const,
  },
} as const;
