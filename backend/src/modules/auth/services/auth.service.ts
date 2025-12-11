import { Injectable } from '@nestjs/common';
import { JwtService } from 'modules/auth/services/jwt.service';
import { JwtPayload } from 'modules/auth/interfaces/jwt-payload.interface';
import { LoginResponseDto, UserProfileDto } from 'modules/auth/dto/auth.dto';
import { plainToInstance } from 'class-transformer';
import {
  GithubProfile,
  User,
  UserRole,
  ServiceTier,
} from 'modules/auth/interfaces/user.interface';

/**
 * Auth Service
 * Xử lý logic nghiệp vụ xác thực
 * Bao gồm: validateUser (upsert), login (ký token)
 */
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Xác thực người dùng từ GitHub profile
   * Tạo hoặc cập nhật người dùng trong database
   * @param profile - GitHub profile từ OAuth callback
   * @returns Người dùng đã được tạo/cập nhật
   */
  validateUser(profile: GithubProfile): User {
    // TODO: Implement upsert user logic with PrismaService
    // Kiểm tra nếu user tồn tại, cập nhật; nếu không, tạo mới
    const user: User = {
      id: `github_${profile.id}`,
      email: profile.emails[0].value,
      name: profile.displayName,
      avatarUrl: profile.photos[0].value,
      githubId: profile.id,
      githubToken: null,
      role: UserRole.USER,
      tier: ServiceTier.FREE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return user;
  }

  /**
   * Đăng nhập người dùng
   * Ký JWT token cho người dùng
   * @param user - Người dùng đã xác thực
   * @returns Token và thông tin token
   */
  async login(user: User): Promise<LoginResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.sign(payload);
    return {
      accessToken,
      tokenType: 'Bearer',
    };
  }

  /**
   * Lấy thông tin người dùng từ JWT payload
   * Chuyển đổi từ payload sang UserProfileDto
   * @param payload - JWT payload
   * @returns Thông tin người dùng để trả về cho client
   */
  getUserFromToken(payload: JwtPayload): UserProfileDto {
    const plainUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
      name: null, // TODO: Fetch from DB
      avatarUrl: null, // TODO: Fetch from DB
      tier: ServiceTier.FREE, // TODO: Fetch from DB
    };

    // Chuyển đổi sang instance của UserProfileDto để áp dụng @Exclude/@Expose
    return plainToInstance(UserProfileDto, plainUser, {
      excludeExtraneousValues: true,
    });
  }
}
