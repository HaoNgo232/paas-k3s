import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import * as jose from 'jose';
import { JwtService } from './jwt.service';
import authConfig from '@config/auth.config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// Mock jose library
jest.mock('jose');

describe('JwtService', () => {
  let service: JwtService;

  const mockPayload: JwtPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'USER',
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [authConfig],
        }),
      ],
      providers: [JwtService],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should create JWT token successfully', async () => {
      const mockToken = 'mocked.jwt.token';
      const mockSignJWTInstance = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue(mockToken),
      };

      jest
        .mocked(jose.SignJWT)
        .mockReturnValue(
          mockSignJWTInstance as unknown as InstanceType<typeof jose.SignJWT>,
        );

      const result = await service.sign(mockPayload);

      expect(jose.SignJWT).toHaveBeenCalledWith(mockPayload);
      expect(mockSignJWTInstance.setProtectedHeader).toHaveBeenCalledWith({
        alg: 'HS256',
      });
      expect(mockSignJWTInstance.setIssuedAt).toHaveBeenCalled();
      expect(mockSignJWTInstance.setExpirationTime).toHaveBeenCalledWith('7d');
      expect(result).toBe(mockToken);
    });

    it('should embed custom data in payload', async () => {
      const customPayload: JwtPayload = {
        sub: 'admin-456',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      const mockToken = 'admin.jwt.token';
      const mockSignJWTInstance = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue(mockToken),
      };

      jest
        .mocked(jose.SignJWT)
        .mockReturnValue(
          mockSignJWTInstance as unknown as InstanceType<typeof jose.SignJWT>,
        );

      await service.sign(customPayload);

      expect(jose.SignJWT).toHaveBeenCalledWith(customPayload);
    });

    it('should handle signing error', async () => {
      const mockSignJWTInstance = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockRejectedValue(new Error('Signing failed')),
      };

      jest
        .mocked(jose.SignJWT)
        .mockReturnValue(
          mockSignJWTInstance as unknown as InstanceType<typeof jose.SignJWT>,
        );

      await expect(service.sign(mockPayload)).rejects.toThrow('Signing failed');
    });
  });

  describe('verify', () => {
    it('should verify valid token successfully', async () => {
      const mockToken = 'valid.jwt.token';
      const mockVerifyResult = {
        payload: mockPayload,
        protectedHeader: { alg: 'HS256', typ: 'JWT' },
      };

      jest
        .mocked(jose.jwtVerify)
        .mockResolvedValue(
          mockVerifyResult as unknown as Awaited<
            ReturnType<typeof jose.jwtVerify>
          >,
        );

      const result = await service.verify(mockToken);

      expect(jose.jwtVerify).toHaveBeenCalledWith(
        mockToken,
        expect.any(Uint8Array),
      );
      expect(result).toEqual(mockPayload);
    });

    it('should throw error for invalid token format', async () => {
      const invalidToken = 'invalid-token';

      jest
        .mocked(jose.jwtVerify)
        .mockRejectedValue(new Error('Invalid token format'));

      await expect(service.verify(invalidToken)).rejects.toThrow(
        'Invalid token format',
      );
    });

    it('should throw error for token with wrong signature', async () => {
      const tamperedToken = 'header.payload.wrong_signature';

      jest
        .mocked(jose.jwtVerify)
        .mockRejectedValue(new Error('signature verification failed'));

      await expect(service.verify(tamperedToken)).rejects.toThrow(
        'signature verification failed',
      );
    });

    it('should throw error for expired token', async () => {
      const expiredToken = 'expired.jwt.token';

      // Create custom error that matches jose.errors.JWTExpired structure
      const expiredError = new Error('Token expired');
      expiredError.name = 'JWTExpired';

      jest.mocked(jose.jwtVerify).mockRejectedValue(expiredError);

      await expect(service.verify(expiredToken)).rejects.toThrow(
        'Token expired',
      );
    });

    it('should throw error for malformed token', async () => {
      const malformedToken = 'malformed';

      jest.mocked(jose.jwtVerify).mockRejectedValue(new Error('JWS malformed'));

      await expect(service.verify(malformedToken)).rejects.toThrow(
        'JWS malformed',
      );
    });

    it('should throw error for empty token', async () => {
      const emptyToken = '';

      jest
        .mocked(jose.jwtVerify)
        .mockRejectedValue(new Error('Token cannot be empty'));

      await expect(service.verify(emptyToken)).rejects.toThrow(
        'Token cannot be empty',
      );
    });
  });

  describe('integration', () => {
    it('should sign and verify token successfully', async () => {
      const mockToken = 'signed.jwt.token';

      // Mock sign
      const mockSignJWTInstance = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue(mockToken),
      };
      jest
        .mocked(jose.SignJWT)
        .mockReturnValue(
          mockSignJWTInstance as unknown as InstanceType<typeof jose.SignJWT>,
        );

      // Mock verify
      const mockVerifyResult = {
        payload: mockPayload,
        protectedHeader: { alg: 'HS256' },
      };
      jest
        .mocked(jose.jwtVerify)
        .mockResolvedValue(
          mockVerifyResult as unknown as Awaited<
            ReturnType<typeof jose.jwtVerify>
          >,
        );

      const token = await service.sign(mockPayload);
      const verified = await service.verify(token);

      expect(verified).toEqual(mockPayload);
      expect(verified.sub).toBe(mockPayload.sub);
      expect(verified.email).toBe(mockPayload.email);
    });

    it('should handle multiple sequential operations', async () => {
      const mockTokens = ['token1', 'token2', 'token3'];
      const payloads = [
        { sub: 'user-1', email: 'user1@example.com', role: 'USER' },
        { sub: 'user-2', email: 'user2@example.com', role: 'USER' },
        { sub: 'user-3', email: 'user3@example.com', role: 'ADMIN' },
      ] as JwtPayload[];

      for (let i = 0; i < 3; i++) {
        const mockSignJWTInstance = {
          setProtectedHeader: jest.fn().mockReturnThis(),
          setIssuedAt: jest.fn().mockReturnThis(),
          setExpirationTime: jest.fn().mockReturnThis(),
          sign: jest.fn().mockResolvedValue(mockTokens[i]),
        };
        jest
          .mocked(jose.SignJWT)
          .mockReturnValue(
            mockSignJWTInstance as unknown as InstanceType<typeof jose.SignJWT>,
          );

        const mockVerifyResult = {
          payload: payloads[i],
          protectedHeader: { alg: 'HS256' },
        };
        jest
          .mocked(jose.jwtVerify)
          .mockResolvedValue(
            mockVerifyResult as unknown as Awaited<
              ReturnType<typeof jose.jwtVerify>
            >,
          );

        const token = await service.sign(payloads[i]);
        const verified = await service.verify(token);

        expect(verified).toEqual(payloads[i]);
      }
    });
  });
});
