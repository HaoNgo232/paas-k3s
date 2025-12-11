import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@modules/auth/services/auth.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { JwtPayload } from '@modules/auth/interfaces/jwt-payload.interface';
import { UserProfileDto } from '@modules/auth/dto/auth.dto';
import type { User } from '@modules/auth/interfaces/user.interface';

/**
 * Auth Controller
 * Xử lý các endpoint liên quan đến xác thực
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Bắt đầu OAuth flow với GitHub
   * Endpoint: GET /auth/github
   */
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth(): Promise<void> {
    // Passport sẽ xử lý redirect đến GitHub
  }

  /**
   * GitHub OAuth callback
   * Endpoint: GET /auth/github/callback
   * Được gọi sau khi GitHub xác thực người dùng
   */
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // req.user được đặt bởi GithubStrategy
      const user = req.user as User;
      if (!user) {
        throw new UnauthorizedException('User not found from GitHub');
      }

      // Đăng nhập người dùng và lấy JWT token
      const loginResponse = await this.authService.login(user);

      // Chuyển hướng về frontend với token
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const redirectUrl = `${frontendUrl}/auth/callback?token=${loginResponse.accessToken}`;

      res.redirect(redirectUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  /**
   * Lấy thông tin người dùng hiện tại
   * Endpoint: GET /auth/me
   * Requires: Valid JWT token in Authorization header
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() req: Request): UserProfileDto {
    const payload = req.user as JwtPayload;
    if (!payload) {
      throw new UnauthorizedException('User not found');
    }

    return this.authService.getUserFromToken(payload);
  }

  /**
   * Logout endpoint
   * Endpoint: GET /auth/logout
   * Requires: Valid JWT token in Authorization header
   * Note: Token invalidation handled by frontend (remove token from storage)
   */
  @Get('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res() res: Response): void {
    // Logic đơn giản: client sẽ xóa token từ localStorage/cookies
    // Nếu cần logout trong backend, có thể implement token blacklist
    res.json({ message: 'Logged out successfully' });
  }
}
