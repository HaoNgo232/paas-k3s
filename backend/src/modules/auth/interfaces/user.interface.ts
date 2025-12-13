import { User, ServiceTier, UserRole } from '@/generated/prisma/client';

export { UserRole, ServiceTier };
export type { User };

/**
 * Type Guard cho UserRole validation
 * Prevents runtime errors when casting string to UserRole enum
 */
export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    Object.values(UserRole).includes(value as UserRole)
  );
}

/**
 * Type Guard cho User object validation
 * Safer alternative to direct casting req.user as User
 */
export function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.githubId === 'string' &&
    isUserRole(obj.role)
  );
}

/**
 * GitHub Profile Interface
 * Định nghĩa cấu trúc profile từ GitHub OAuth callback
 *
 * @see https://www.passportjs.org/packages/passport-github2/
 */
export interface GithubProfile {
  id: string;
  username: string;
  displayName: string;
  emails: Array<{ value: string; verified?: boolean }>;
  photos: Array<{ value: string }>;
  profileUrl?: string;
  _json?: unknown;
  _raw?: string;
}

/**
 * User Response DTO
 * Định nghĩa response khi trả về user info qua API
 *
 * **Chỉ expose các fields cần thiết, không trả về sensitive data**
 */
export interface UserResponseDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  tier: ServiceTier;
}
