import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '@modules/auth/auth.controller';
import { AuthService } from '@modules/auth/services/auth.service';
import { JwtService } from '@modules/auth/services/jwt.service';
import { GithubStrategy } from '@modules/auth/strategies/github.strategy';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

/**
 * Auth Module
 * Quản lý xác thực người dùng thông qua GitHub OAuth
 */
@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, GithubStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtService], // Export để các module khác dùng
})
export class AuthModule {}
