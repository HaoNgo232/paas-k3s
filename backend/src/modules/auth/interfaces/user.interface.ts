import { User, UserRole, ServiceTier } from '@prisma/client';

export { UserRole, ServiceTier };
export type { User };

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
