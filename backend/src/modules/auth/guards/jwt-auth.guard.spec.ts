import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '../services/jwt.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

interface MockRequest {
  headers: {
    authorization?: string;
  };
  user?: JwtPayload;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (
    authorizationHeader?: string,
  ): ExecutionContext => {
    const mockRequest: MockRequest = {
      headers: {
        authorization: authorizationHeader,
      },
      user: undefined,
    };

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid Bearer token', async () => {
      const mockPayload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'USER',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      mockJwtService.verify.mockResolvedValue(mockPayload);

      const context = createMockExecutionContext('Bearer valid.jwt.token');
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid.jwt.token');
      expect(mockJwtService.verify).toHaveBeenCalledTimes(1);
    });

    it('should attach user payload to request', async () => {
      const mockPayload: JwtPayload = {
        sub: 'user-456',
        email: 'attach@example.com',
        role: 'ADMIN',
        name: 'Admin User',
        avatarUrl: 'https://example.com/admin-avatar.jpg',
      };

      mockJwtService.verify.mockResolvedValue(mockPayload);

      const context = createMockExecutionContext('Bearer attach.jwt.token');
      const request = context.switchToHttp().getRequest<MockRequest>();

      await guard.canActivate(context);

      expect(request.user).toBeDefined();
      expect(request.user).toEqual(mockPayload);
    });

    it('should throw UnauthorizedException when no authorization header', async () => {
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token not found',
      );
    });

    it('should throw UnauthorizedException for empty authorization header', async () => {
      const context = createMockExecutionContext('');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token not found',
      );
    });

    it('should throw UnauthorizedException for invalid Bearer format (missing scheme)', async () => {
      const context = createMockExecutionContext('just.a.token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid Authorization header format',
      );
    });

    it('should throw UnauthorizedException for invalid scheme (not Bearer)', async () => {
      const context = createMockExecutionContext('Basic dXNlcjpwYXNz');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid Authorization header format',
      );
    });

    it('should throw UnauthorizedException for Bearer with no token', async () => {
      const context = createMockExecutionContext('Bearer ');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid Authorization header format',
      );
    });

    it('should throw UnauthorizedException for Bearer with only whitespace', async () => {
      const context = createMockExecutionContext('Bearer   ');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid Authorization header format',
      );
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      mockJwtService.verify.mockRejectedValue(new Error('Invalid signature'));

      const context = createMockExecutionContext('Bearer invalid.token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Failed to verify token: Invalid signature',
      );
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      mockJwtService.verify.mockRejectedValue(new Error('Token expired'));

      const context = createMockExecutionContext('Bearer expired.token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Failed to verify token: Token expired',
      );
    });

    it('should throw UnauthorizedException when token is malformed', async () => {
      mockJwtService.verify.mockRejectedValue(new Error('Malformed token'));

      const context = createMockExecutionContext('Bearer malformed');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Failed to verify token: Malformed token',
      );
    });

    it('should handle non-Error exceptions from jwtService', async () => {
      mockJwtService.verify.mockRejectedValue('String error');

      const context = createMockExecutionContext('Bearer error.token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Failed to verify token: Invalid token',
      );
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', async () => {
      const mockPayload: JwtPayload = {
        sub: 'extract-user',
        email: 'extract@example.com',
        role: 'USER',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      mockJwtService.verify.mockResolvedValue(mockPayload);

      const context = createMockExecutionContext('Bearer extract.jwt.token');

      await guard.canActivate(context);

      expect(mockJwtService.verify).toHaveBeenCalledWith('extract.jwt.token');
    });

    it('should handle token with extra whitespace', async () => {
      // Note: split(' ') only splits on first space, so "Bearer  token" becomes ["Bearer", "", "token"]
      // This test should throw because token will be empty string after split
      const context = createMockExecutionContext('Bearer  whitespace.token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid Authorization header format',
      );
    });

    it('should preserve original token value', async () => {
      const originalToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const mockPayload: JwtPayload = {
        sub: 'preserve-user',
        email: 'preserve@example.com',
        role: 'USER',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      mockJwtService.verify.mockResolvedValue(mockPayload);

      const context = createMockExecutionContext(`Bearer ${originalToken}`);

      await guard.canActivate(context);

      expect(mockJwtService.verify).toHaveBeenCalledWith(originalToken);
    });
  });

  describe('edge cases and security', () => {
    it('should not call verify if authorization header is missing', async () => {
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow();
      expect(mockJwtService.verify).not.toHaveBeenCalled();
    });

    it('should reject lowercase bearer scheme', async () => {
      const context = createMockExecutionContext('bearer lowercase.token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid Authorization header format',
      );
    });

    it('should reject mixed case Bearer scheme', async () => {
      const context = createMockExecutionContext('BeArEr mixed.token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid Authorization header format',
      );
    });

    it('should handle consecutive Bearer keywords', async () => {
      const context = createMockExecutionContext('Bearer Bearer token');

      // This should extract "Bearer" as the token (technically valid format but invalid token)
      mockJwtService.verify.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle concurrent guard execution', async () => {
      const mockPayload1: JwtPayload = {
        sub: 'concurrent-1',
        email: 'concurrent1@example.com',
        role: 'USER',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const mockPayload2: JwtPayload = {
        sub: 'concurrent-2',
        email: 'concurrent2@example.com',
        role: 'ADMIN',
        name: 'Admin User',
        avatarUrl: 'https://example.com/admin-avatar.jpg',
      };

      mockJwtService.verify
        .mockResolvedValueOnce(mockPayload1)
        .mockResolvedValueOnce(mockPayload2);

      const context1 = createMockExecutionContext('Bearer token1');
      const context2 = createMockExecutionContext('Bearer token2');

      const [result1, result2] = await Promise.all([
        guard.canActivate(context1),
        guard.canActivate(context2),
      ]);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockJwtService.verify).toHaveBeenCalledTimes(2);
    });

    it('should not leak token in error messages', async () => {
      mockJwtService.verify.mockRejectedValue(new Error('Verification failed'));

      const sensitiveToken = 'supersecret.jwt.token';
      const context = createMockExecutionContext(`Bearer ${sensitiveToken}`);

      try {
        await guard.canActivate(context);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        if (error instanceof Error) {
          expect(error.message).not.toContain(sensitiveToken);
        }
      }
    });
  });

  describe('integration scenarios', () => {
    it('should successfully authorize admin user', async () => {
      const adminPayload: JwtPayload = {
        sub: 'admin-001',
        email: 'admin@example.com',
        role: 'ADMIN',
        name: 'Admin User',
        avatarUrl: 'https://example.com/admin-avatar.jpg',
      };

      mockJwtService.verify.mockResolvedValue(adminPayload);

      const context = createMockExecutionContext('Bearer admin.token');
      const request = context.switchToHttp().getRequest<MockRequest>();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user?.role).toBe('ADMIN');
    });

    it('should successfully authorize regular user', async () => {
      const userPayload: JwtPayload = {
        sub: 'user-001',
        email: 'user@example.com',
        role: 'USER',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      mockJwtService.verify.mockResolvedValue(userPayload);

      const context = createMockExecutionContext('Bearer user.token');
      const request = context.switchToHttp().getRequest<MockRequest>();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user?.role).toBe('USER');
    });
  });
});
