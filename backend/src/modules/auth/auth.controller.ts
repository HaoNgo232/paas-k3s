import {
  Controller,
  Get,
  Post,
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
import { validateJwtPayload } from '@modules/auth/guards/jwt-payload.guard';
import { UserProfileDto } from '@modules/auth/dto/auth.dto';
import { isUser, type User } from '@modules/auth/interfaces/user.interface';
import { FRONTEND_ROUTES, buildRedirectUrl } from '@common/constants';
import { ResponseWrapper } from '@common/interfaces/api-response.interface';

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
      // req.user được đặt bởi GithubStrategy - validate with type guard
      if (!isUser(req.user)) {
        throw new UnauthorizedException('User not found from GitHub');
      }
      const user = req.user;

      // Đăng nhập người dùng và lấy JWT token
      const loginResponse = await this.authService.login(user);

      // Chuyển hướng về frontend với token
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const redirectUrl = buildRedirectUrl(
        frontendUrl,
        FRONTEND_ROUTES.CALLBACK,
        { token: loginResponse.accessToken },
      );

      res.redirect(redirectUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const redirectUrl = buildRedirectUrl(frontendUrl, FRONTEND_ROUTES.LOGIN, {
        error: errorMessage,
      });
      res.redirect(redirectUrl);
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
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = validateJwtPayload(req.user);
    return this.authService.getUserFromToken(payload);
  }

  /**
   * Logout endpoint
   * Endpoint: POST /auth/logout
   * Requires: Valid JWT token in Authorization header
   * Note: Token invalidation handled by frontend (remove token from storage)
   * Future: Có thể thêm token blacklist hoặc audit log
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = validateJwtPayload(req.user);
    // Gọi service để xử lý logout logic (hiện tại chỉ log)
    this.authService.logout(payload);

    return ResponseWrapper.noContent('Logged out successfully');
  }
}
