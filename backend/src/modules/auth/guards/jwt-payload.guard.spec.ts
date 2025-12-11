import { JwtPayload } from '@/modules/auth/interfaces/jwt-payload.interface';
import { isJwtPayload, validateJwtPayload } from './jwt-payload.guard';

describe('JWT Payload Guards', () => {
  describe('isJwtPayload', () => {
    it('should return true for valid payload', () => {
      const validPayload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
      };

      expect(isJwtPayload(validPayload)).toBe(true);
    });

    it('should return true for valid payload with null name and avatarUrl', () => {
      const validPayload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        name: null,
        avatarUrl: null,
        role: 'USER',
      };

      expect(isJwtPayload(validPayload)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isJwtPayload(null)).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isJwtPayload('string')).toBe(false);
      expect(isJwtPayload(123)).toBe(false);
      expect(isJwtPayload(true)).toBe(false);
      expect(isJwtPayload(undefined)).toBe(false);
    });

    it('should return false when missing sub', () => {
      const invalidPayload = {
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
      };

      expect(isJwtPayload(invalidPayload)).toBe(false);
    });

    it('should return false when missing email', () => {
      const invalidPayload = {
        sub: 'user-123',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
      };

      expect(isJwtPayload(invalidPayload)).toBe(false);
    });

    it('should return false when missing role', () => {
      const invalidPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      expect(isJwtPayload(invalidPayload)).toBe(false);
    });

    it('should return false when sub is not string', () => {
      const invalidPayload = {
        sub: 123,
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
      };

      expect(isJwtPayload(invalidPayload)).toBe(false);
    });

    it('should return false when name is not string or null', () => {
      const invalidPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 123,
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
      };

      expect(isJwtPayload(invalidPayload)).toBe(false);
    });

    it('should return false when avatarUrl is not string or null', () => {
      const invalidPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 123,
        role: 'USER',
      };

      expect(isJwtPayload(invalidPayload)).toBe(false);
    });

    it('should return true when payload has extra properties', () => {
      const payloadWithExtra = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
        iat: 1234567890,
        exp: 1234567890,
        extraField: 'extra',
      };

      expect(isJwtPayload(payloadWithExtra)).toBe(true);
    });
  });

  describe('validateJwtPayload', () => {
    it('should return payload when valid', () => {
      const validPayload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
      };

      const result = validateJwtPayload(validPayload);
      expect(result).toEqual(validPayload);
    });

    it('should throw error when payload is invalid', () => {
      const invalidPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        // missing role
      };

      expect(() => validateJwtPayload(invalidPayload)).toThrow(
        'Invalid JWT payload structure',
      );
    });

    it('should throw error when payload is null', () => {
      expect(() => validateJwtPayload(null)).toThrow(
        'Invalid JWT payload structure',
      );
    });

    it('should throw error when payload is not an object', () => {
      expect(() => validateJwtPayload('not an object')).toThrow(
        'Invalid JWT payload structure',
      );
    });

    it('should return payload with extra properties', () => {
      const payloadWithExtra = {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
        iat: 1234567890,
        exp: 1234567890,
      };

      const result = validateJwtPayload(payloadWithExtra);
      expect(result).toEqual(payloadWithExtra);
    });
  });
});
