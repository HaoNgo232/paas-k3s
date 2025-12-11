import type { JWTPayload } from 'jose';

/**
 * JWT Payload Interface
 * Extend từ jose.JWTPayload để kế thừa standard claims (iat, exp, sub, etc.)
 * Thêm custom claims cho application
 */
export interface JwtPayload extends JWTPayload {
  sub: string; // User ID (override để bắt buộc)
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
}
