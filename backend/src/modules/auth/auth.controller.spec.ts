import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { ResponseWrapper } from '@common/interfaces/api-response.interface';
import { AuthService } from './services/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserProfileDto } from './dto/auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User, UserRole, ServiceTier } from './interfaces/user.interface';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    getUserFromToken: jest.fn(),
    logout: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((_context: ExecutionContext) => {
      return true;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('githubAuth', () => {
    it('should be defined', () => {
      expect(controller.githubAuth.bind(controller)).toBeDefined();
    });

    it('should not throw error when called', async () => {
      await expect(controller.githubAuth()).resolves.not.toThrow();
    });

    it('should return void', async () => {
      const result = await controller.githubAuth();
      expect(result).toBeUndefined();
    });
  });

  describe('githubAuthRedirect', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let loggerErrorSpy: jest.SpyInstance;

    const mockUser: User = {
      id: 'user-123',
      githubId: '12345',
      githubToken: null,
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: 'https://avatar.url/test.jpg',
      role: UserRole.USER,
      tier: ServiceTier.FREE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockRequest = {
        user: mockUser,
      };

      mockResponse = {
        redirect: jest.fn(),
      };

      mockConfigService.get.mockReturnValue('http://localhost:3000');

      // mock logger on controller
      loggerErrorSpy = jest.fn();
      (controller as unknown as { logger: { error: jest.Mock } }).logger = {
        error: loggerErrorSpy,
      };
    });

    it('should redirect to frontend callback with token on success', async () => {
      const mockLoginResponse = { accessToken: 'mock.jwt.token' };
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await controller.githubAuthRedirect(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/callback?token=mock.jwt.token',
      );
    });

    it('should use custom FRONTEND_URL from config', async () => {
      mockConfigService.get.mockReturnValue('https://production.example.com');
      const mockLoginResponse = { accessToken: 'prod.jwt.token' };
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await controller.githubAuthRedirect(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockConfigService.get).toHaveBeenCalledWith('FRONTEND_URL');
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'https://production.example.com/callback?token=prod.jwt.token',
      );
    });

    it('should redirect to login with error when user is missing', async () => {
      mockRequest.user = undefined;

      await controller.githubAuthRedirect(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?error=User+not+found+from+GitHub',
      );
    });

    it('should redirect to login with error when user is null', async () => {
      mockRequest.user = null as unknown as User;

      await controller.githubAuthRedirect(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?error=User+not+found+from+GitHub',
      );
    });

    it('should redirect to login with error when login fails', async () => {
      mockAuthService.login.mockRejectedValue(
        new Error('Database connection error'),
      );

      await controller.githubAuthRedirect(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?error=Database+connection+error',
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GitHub OAuth callback failed: Database connection error',
        expect.any(String),
      );
    });

    it('should handle unknown error type', async () => {
      mockAuthService.login.mockRejectedValue('String error');

      await controller.githubAuthRedirect(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?error=Unknown+error',
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'GitHub OAuth callback failed: Unknown error',
        undefined,
      );
    });

    it('should URL encode error messages properly', async () => {
      mockAuthService.login.mockRejectedValue(
        new Error('Failed: Invalid characters & symbols!'),
      );

      await controller.githubAuthRedirect(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining(
          'error=Failed%3A+Invalid+characters+%26+symbols%21',
        ),
      );
    });

    it('should use default FRONTEND_URL when config returns undefined', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const mockLoginResponse = { accessToken: 'default.token' };
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await controller.githubAuthRedirect(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/callback?token=default.token',
      );
    });

    it('should handle admin user successfully', async () => {
      const adminUser: User = { ...mockUser, role: UserRole.ADMIN };
      mockRequest.user = adminUser;
      const mockLoginResponse = { accessToken: 'admin.token' };
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await controller.githubAuthRedirect(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(adminUser);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/callback?token=admin.token',
      );
    });
  });

  describe('getCurrentUser', () => {
    let mockRequest: Partial<Request>;

    const mockJwtPayload: JwtPayload = {
      sub: 'user-456',
      email: 'current@example.com',
      role: UserRole.USER,
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    const mockUserProfile: UserProfileDto = {
      id: 'user-456',
      email: 'current@example.com',
      name: 'Current User',
      avatarUrl: 'https://avatar.url/current.jpg',
      role: UserRole.USER,
      tier: ServiceTier.FREE,
    };

    beforeEach(() => {
      mockRequest = {
        user: mockJwtPayload,
      };
    });

    it('should return user profile from JWT payload', () => {
      mockAuthService.getUserFromToken.mockReturnValue(mockUserProfile);

      const result = controller.getCurrentUser(mockRequest as Request);

      expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith(
        mockJwtPayload,
      );
      // ✅ Controller now returns raw data - TransformInterceptor will wrap it
      expect(result).toEqual(mockUserProfile);
    });

    it('should throw UnauthorizedException when user is missing', () => {
      mockRequest.user = undefined;

      expect(() => controller.getCurrentUser(mockRequest as Request)).toThrow(
        UnauthorizedException,
      );
      expect(() => controller.getCurrentUser(mockRequest as Request)).toThrow(
        'User not found',
      );
    });

    it('should throw UnauthorizedException when user is null', () => {
      mockRequest.user = null as unknown as User;

      expect(() => controller.getCurrentUser(mockRequest as Request)).toThrow(
        UnauthorizedException,
      );
      expect(() => controller.getCurrentUser(mockRequest as Request)).toThrow(
        'User not found',
      );
    });

    it('should handle admin user profile', () => {
      const adminPayload: JwtPayload = {
        ...mockJwtPayload,
        role: UserRole.ADMIN,
      };
      const adminProfile: UserProfileDto = {
        ...mockUserProfile,
        role: UserRole.ADMIN,
      };

      mockRequest.user = adminPayload;
      mockAuthService.getUserFromToken.mockReturnValue(adminProfile);

      const result = controller.getCurrentUser(mockRequest as Request);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(result).toEqual(adminProfile);
    });

    it('should call getUserFromToken with correct payload structure', () => {
      mockAuthService.getUserFromToken.mockReturnValue(mockUserProfile);

      controller.getCurrentUser(mockRequest as Request);

      expect(mockAuthService.getUserFromToken).toHaveBeenCalledTimes(1);
      expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: expect.any(String) as string,
          email: expect.any(String) as string,
          role: expect.any(String) as string,
        }),
      );
    });

    it('should not modify the request object', () => {
      const originalUser = { ...mockJwtPayload };
      mockRequest.user = originalUser;
      mockAuthService.getUserFromToken.mockReturnValue(mockUserProfile);

      controller.getCurrentUser(mockRequest as Request);

      expect(mockRequest.user).toEqual(originalUser);
    });
  });

  describe('logout', () => {
    let mockRequest: Partial<Request>;

    const mockJwtPayload: JwtPayload = {
      sub: 'user-789',
      email: 'logout-user@example.com',
      role: UserRole.USER,
      name: 'Logout User',
      avatarUrl: 'https://example.com/logout-avatar.jpg',
    };

    beforeEach(() => {
      mockRequest = {
        user: mockJwtPayload,
      };
      // Reset mock để đảm bảo clean state
      jest.clearAllMocks();
    });

    it('should return success message', () => {
      const result = controller.logout(mockRequest as Request);

      // ✅ Controller now returns ResponseWrapper - TransformInterceptor will handle final format
      expect(result).toBeInstanceOf(ResponseWrapper);
      expect(result.data).toBeNull();
      expect(result.message).toBe('Logged out successfully');
    });

    it('should call authService.logout with payload', () => {
      controller.logout(mockRequest as Request);

      expect(mockAuthService.logout).toHaveBeenCalledWith(mockJwtPayload);
      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when user is missing', () => {
      mockRequest.user = undefined;

      expect(() => controller.logout(mockRequest as Request)).toThrow(
        UnauthorizedException,
      );
      expect(() => controller.logout(mockRequest as Request)).toThrow(
        'User not found',
      );
    });

    it('should throw UnauthorizedException when user is null', () => {
      mockRequest.user = null as unknown as User;

      expect(() => controller.logout(mockRequest as Request)).toThrow(
        UnauthorizedException,
      );
      expect(() => controller.logout(mockRequest as Request)).toThrow(
        'User not found',
      );
    });

    it('should return consistent response format', () => {
      const result = controller.logout(mockRequest as Request);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('message');
      expect(result.data).toBeNull();
      expect(typeof result.message).toBe('string');
    });
  });
});
