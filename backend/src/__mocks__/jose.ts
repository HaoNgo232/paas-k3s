/**
 * Manual mock for jose library
 * Jest cannot handle ESM modules natively, so we mock jose methods
 *
 * NOTE: This mock file uses `any` types and disables certain ESLint rules because:
 * 1. It's a test mock that needs to match jest's flexible API
 * 2. The real jose library uses complex generic types that are impractical to fully replicate
 * 3. Type safety is enforced at the test file level, not in the mock implementation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Store mock implementation for testing
let mockSignImplementation: (() => Promise<string>) | undefined;
let mockVerifyImplementation: ((token: string) => Promise<any>) | undefined;

export const SignJWT = jest.fn().mockImplementation((payload: any) => {
  const instance = {
    _payload: payload,
    _header: {},
    setProtectedHeader: jest.fn(function (header: any) {
      this._header = header;
      return this;
    }),
    setIssuedAt: jest.fn(function () {
      return this;
    }),
    setExpirationTime: jest.fn(function (exp: string) {
      return this;
    }),
    sign: jest.fn(async function () {
      if (mockSignImplementation) {
        return mockSignImplementation();
      }
      // Return a mock JWT structure
      const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      ).toString('base64url');
      const payloadStr = Buffer.from(JSON.stringify(this._payload)).toString(
        'base64url',
      );
      const signature = 'mock_signature';
      return `${header}.${payloadStr}.${signature}`;
    }),
  };
  return instance;
});

export const jwtVerify = jest.fn(async (token: string, secret: any) => {
  if (mockVerifyImplementation) {
    return mockVerifyImplementation(token);
  }

  // Default: parse the mocked token
  try {
    const [header, payload] = token.split('.');
    return {
      payload: JSON.parse(Buffer.from(payload, 'base64url').toString()),
      protectedHeader: JSON.parse(Buffer.from(header, 'base64url').toString()),
    };
  } catch {
    throw new Error('Invalid token');
  }
});

export const errors = {
  JWTExpired: class JWTExpired extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'JWTExpired';
    }
  },
};

// Export helpers for test setup
export const __setMockSignImplementation = (
  impl: (() => Promise<string>) | undefined,
) => {
  mockSignImplementation = impl;
};

export const __setMockVerifyImplementation = (
  impl: ((token: string) => Promise<any>) | undefined,
) => {
  mockVerifyImplementation = impl;
};

export const __resetMocks = () => {
  mockSignImplementation = undefined;
  mockVerifyImplementation = undefined;
  jest.mocked(SignJWT).mockClear();
  jest.mocked(jwtVerify).mockClear();
};
