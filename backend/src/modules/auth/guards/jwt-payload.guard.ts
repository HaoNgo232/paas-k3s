import { JwtPayload } from '@/modules/auth/interfaces/jwt-payload.interface';

/**
 * Type Guard cho JwtPayload
 * Kiểm tra runtime để đảm bảo payload có đầy đủ fields
 */
export function isJwtPayload(payload: unknown): payload is JwtPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const obj = payload as Record<string, unknown>;

  // Kiểm tra required fields
  return (
    typeof obj.sub === 'string' &&
    typeof obj.email === 'string' &&
    (obj.name === null || typeof obj.name === 'string') &&
    (obj.avatarUrl === null || typeof obj.avatarUrl === 'string') &&
    typeof obj.role === 'string'
  );
}

/**
 * Validate và cast payload an toàn
 * @throws Error nếu payload không hợp lệ
 */
export function validateJwtPayload(payload: unknown): JwtPayload {
  if (!isJwtPayload(payload)) {
    throw new Error(
      'Invalid JWT payload structure: missing or invalid required fields',
    );
  }
  return payload;
}
