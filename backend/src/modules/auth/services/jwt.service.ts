import { Injectable, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as jose from 'jose';
import authConfig from '@config/auth.config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * JWT Service
 * Wrapper cho thư viện jose để xử lý ký và xác minh JWT
 * Giúp code sạch và dễ test hơn
 */
@Injectable()
export class JwtService {
  private readonly secret: Uint8Array;

  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {
    this.secret = new TextEncoder().encode(this.config.jwtSecret);
  }

  /**
   * Ký JWT token
   * @param payload - Dữ liệu để nhúng vào token
   * @returns Token đã ký
   */
  async sign(payload: JwtPayload): Promise<string> {
    return new jose.SignJWT(payload as unknown as jose.JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(this.config.jwtExpiresIn)
      .sign(this.secret);
  }

  /**
   * Xác minh JWT token
   * @param token - Token cần xác minh
   * @returns Payload nếu token hợp lệ
   * @throws Error nếu token không hợp lệ hoặc hết hạn
   */
  async verify(token: string): Promise<JwtPayload> {
    const { payload } = await jose.jwtVerify(token, this.secret);
    return payload as unknown as JwtPayload;
  }
}
