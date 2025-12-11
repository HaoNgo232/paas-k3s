import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import type { VerifyCallback } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { GithubProfile, User } from '../interfaces/user.interface';

/**
 * GitHub OAuth Strategy
 * Xử lý xác thực thông qua GitHub OAuth 2.0
 */
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET');
    const callbackURL = configService.get<string>('CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        'Missing GitHub OAuth configuration: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, or CALLBACK_URL',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email'],
    });
  }

  /**
   * Verify callback
   * Được gọi khi OAuth callback thành công
   * @param accessToken - GitHub access token
   * @param refreshToken - GitHub refresh token (nếu có)
   * @param profile - GitHub user profile
   * @param done - Callback để trả về kết quả
   */
  validate(
    accessToken: string,
    refreshToken: string,
    profile: GithubProfile,
    done: VerifyCallback,
  ): void {
    try {
      // Xác thực hoặc tạo mới user
      const user: User = this.authService.validateUser(profile);
      done(null, user);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      done(err);
    }
  }
}
