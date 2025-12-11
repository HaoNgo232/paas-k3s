/**
 * JWT Payload Interface
 * Định nghĩa cấu trúc của JWT payload
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  iat?: number; // Issued At
  exp?: number; // Expiration Time
}
