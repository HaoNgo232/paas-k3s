import {
  UserRole,
  ServiceTier,
} from '@/modules/auth/interfaces/user.interface';
import { Exclude, Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsString } from 'class-validator';

/**
 * Login Response DTO
 * Định nghĩa response sau khi đăng nhập thành công
 */
@Exclude() // Loại bỏ tất cả fields không được đánh dấu @Expose
export class LoginResponseDto {
  @Expose()
  @IsString()
  accessToken: string;

  @Expose()
  @IsString()
  tokenType: string = 'Bearer';
}

/**
 * User Profile DTO
 * Định nghĩa thông tin hồ sơ người dùng
 */
@Exclude()
export class UserProfileDto {
  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsEmail()
  email: string;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  avatarUrl?: string;

  @Expose()
  @IsEnum(UserRole)
  role: UserRole;

  @Expose()
  @IsEnum(ServiceTier)
  tier: ServiceTier;
}
