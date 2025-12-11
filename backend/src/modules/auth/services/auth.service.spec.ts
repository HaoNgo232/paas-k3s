import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import {
  GithubProfile,
  User,
  UserRole,
  ServiceTier,
} from '../interfaces/user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

describe('AuthService', () => {
  let service: AuthService;

  // Mock JWT Service
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should create user from GitHub profile', () => {
      const mockProfile: GithubProfile = {
        id: '12345',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com', verified: true }],
        photos: [{ value: 'https://github.com/avatar.jpg' }],
        username: 'testuser',
      };

      const user = service.validateUser(mockProfile);

      expect(user).toBeDefined();
      expect(user.id).toBe('github_12345');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.avatarUrl).toBe('https://github.com/avatar.jpg');
      expect(user.githubId).toBe('12345');
      expect(user.role).toBe(UserRole.USER);
      expect(user.tier).toBe(ServiceTier.FREE);
    });

    it('should use first email from profile', () => {
      const mockProfile: GithubProfile = {
        id: '67890',
        displayName: 'Multi Email User',
        emails: [
          { value: 'primary@example.com', verified: true },
          { value: 'secondary@example.com', verified: false },
        ],
        photos: [{ value: 'https://github.com/avatar2.jpg' }],
        username: 'multiemailuser',
      };

      const user = service.validateUser(mockProfile);

      expect(user.email).toBe('primary@example.com');
    });

    it('should use first photo from profile', () => {
      const mockProfile: GithubProfile = {
        id: '11111',
        displayName: 'Multi Photo User',
        emails: [{ value: 'photo@example.com', verified: true }],
        photos: [
          { value: 'https://github.com/avatar1.jpg' },
          { value: 'https://github.com/avatar2.jpg' },
        ],
        username: 'photouser',
      };

      const user = service.validateUser(mockProfile);

      expect(user.avatarUrl).toBe('https://github.com/avatar1.jpg');
    });

    it('should create user with default role USER', () => {
      const mockProfile: GithubProfile = {
        id: '22222',
        displayName: 'New User',
        emails: [{ value: 'newuser@example.com', verified: true }],
        photos: [{ value: 'https://github.com/new.jpg' }],
        username: 'newuser',
      };

      const user = service.validateUser(mockProfile);

      expect(user.role).toBe(UserRole.USER);
    });

    it('should create user with default tier FREE', () => {
      const mockProfile: GithubProfile = {
        id: '33333',
        displayName: 'Free Tier User',
        emails: [{ value: 'freetier@example.com', verified: true }],
        photos: [{ value: 'https://github.com/free.jpg' }],
        username: 'freeuser',
      };

      const user = service.validateUser(mockProfile);

      expect(user.tier).toBe(ServiceTier.FREE);
    });

    it('should set githubToken to null', () => {
      const mockProfile: GithubProfile = {
        id: '44444',
        displayName: 'Token Test User',
        emails: [{ value: 'token@example.com', verified: true }],
        photos: [{ value: 'https://github.com/token.jpg' }],
        username: 'tokenuser',
      };

      const user = service.validateUser(mockProfile);

      expect(user.githubToken).toBeNull();
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const beforeCreate = new Date();

      const mockProfile: GithubProfile = {
        id: '55555',
        displayName: 'Timestamp User',
        emails: [{ value: 'timestamp@example.com', verified: true }],
        photos: [{ value: 'https://github.com/timestamp.jpg' }],
        username: 'timestampuser',
      };

      const user = service.validateUser(mockProfile);
      const afterCreate = new Date();

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });
  });

  describe('login', () => {
    it('should return access token for valid user', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'login@example.com',
        name: 'Login User',
        avatarUrl: 'https://github.com/login.jpg',
        githubId: '99999',
        githubToken: null,
        role: UserRole.USER,
        tier: ServiceTier.FREE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'mock.jwt.token';
      mockJwtService.sign.mockResolvedValue(mockToken);

      const result = await service.login(mockUser);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe(mockToken);
      expect(result.tokenType).toBe('Bearer');
    });

    it('should call jwtService.sign with correct payload', async () => {
      const mockUser: User = {
        id: 'user-456',
        email: 'payload@example.com',
        name: 'Payload User',
        avatarUrl: 'https://github.com/payload.jpg',
        githubId: '88888',
        githubToken: null,
        role: UserRole.ADMIN,
        tier: ServiceTier.PRO,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'admin.jwt.token';
      mockJwtService.sign.mockResolvedValue(mockToken);

      await service.login(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-456',
        email: 'payload@example.com',
        role: UserRole.ADMIN,
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('should handle admin user role in payload', async () => {
      const adminUser: User = {
        id: 'admin-001',
        email: 'admin@example.com',
        name: 'Admin User',
        avatarUrl: 'https://github.com/admin.jpg',
        githubId: '77777',
        githubToken: null,
        role: UserRole.ADMIN,
        tier: ServiceTier.TEAM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'admin.jwt.token';
      mockJwtService.sign.mockResolvedValue(mockToken);

      await service.login(adminUser);

      const calls = mockJwtService.sign.mock.calls as [[JwtPayload]];
      const callArgs = calls[0]?.[0];
      expect(callArgs.role).toBe(UserRole.ADMIN);
    });

    it('should not include tier in JWT payload', async () => {
      const mockUser: User = {
        id: 'user-tier',
        email: 'tier@example.com',
        name: 'Tier User',
        avatarUrl: 'https://github.com/tier.jpg',
        githubId: '66666',
        githubToken: null,
        role: UserRole.USER,
        tier: ServiceTier.PRO,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'tier.jwt.token';
      mockJwtService.sign.mockResolvedValue(mockToken);

      await service.login(mockUser);

      const calls = mockJwtService.sign.mock.calls as [
        [Record<string, unknown>],
      ];
      const payload = calls[0]?.[0];
      expect(payload).not.toHaveProperty('tier');
    });
  });

  describe('getUserFromToken', () => {
    it('should convert JWT payload to UserProfileDto', () => {
      const mockPayload: JwtPayload = {
        sub: 'token-user-123',
        email: 'tokenuser@example.com',
        role: 'USER',
      };

      const userProfile = service.getUserFromToken(mockPayload);

      expect(userProfile).toBeDefined();
      expect(userProfile.id).toBe('token-user-123');
      expect(userProfile.email).toBe('tokenuser@example.com');
      expect(userProfile.role).toBe(UserRole.USER);
    });

    it('should set default values for missing fields', () => {
      const mockPayload: JwtPayload = {
        sub: 'minimal-user',
        email: 'minimal@example.com',
        role: 'USER',
      };

      const userProfile = service.getUserFromToken(mockPayload);

      expect(userProfile.name).toBeNull();
      expect(userProfile.avatarUrl).toBeNull();
      expect(userProfile.tier).toBe(ServiceTier.FREE);
    });

    it('should handle ADMIN role', () => {
      const mockPayload: JwtPayload = {
        sub: 'admin-token-123',
        email: 'admintoken@example.com',
        role: 'ADMIN',
      };

      const userProfile = service.getUserFromToken(mockPayload);

      expect(userProfile.role).toBe(UserRole.ADMIN);
    });

    it('should return instance of UserProfileDto', () => {
      const mockPayload: JwtPayload = {
        sub: 'dto-user',
        email: 'dto@example.com',
        role: 'USER',
      };

      const userProfile = service.getUserFromToken(mockPayload);

      // Check that it has all required UserProfileDto properties
      expect(userProfile).toHaveProperty('id');
      expect(userProfile).toHaveProperty('email');
      expect(userProfile).toHaveProperty('role');
      expect(userProfile).toHaveProperty('name');
      expect(userProfile).toHaveProperty('avatarUrl');
      expect(userProfile).toHaveProperty('tier');
    });
  });

  describe('edge cases', () => {
    it('should handle user with minimal GitHub profile data', () => {
      const minimalProfile: GithubProfile = {
        id: 'minimal-id',
        displayName: '',
        emails: [{ value: 'minimal@example.com', verified: true }],
        photos: [{ value: '' }],
        username: 'minimal',
      };

      const user = service.validateUser(minimalProfile);

      expect(user.id).toBe('github_minimal-id');
      expect(user.email).toBe('minimal@example.com');
      expect(user.name).toBe('');
      expect(user.avatarUrl).toBe('');
    });

    it('should handle concurrent login calls', async () => {
      const user1: User = {
        id: 'concurrent-1',
        email: 'concurrent1@example.com',
        name: 'User 1',
        avatarUrl: 'url1',
        githubId: '111',
        githubToken: null,
        role: UserRole.USER,
        tier: ServiceTier.FREE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user2: User = {
        id: 'concurrent-2',
        email: 'concurrent2@example.com',
        name: 'User 2',
        avatarUrl: 'url2',
        githubId: '222',
        githubToken: null,
        role: UserRole.USER,
        tier: ServiceTier.FREE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockJwtService.sign
        .mockResolvedValueOnce('token1')
        .mockResolvedValueOnce('token2');

      const [result1, result2] = await Promise.all([
        service.login(user1),
        service.login(user2),
      ]);

      expect(result1.accessToken).toBe('token1');
      expect(result2.accessToken).toBe('token2');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });
});
