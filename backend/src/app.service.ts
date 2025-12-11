import type { ConfigType } from '@nestjs/config';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appConfig from '@config/app.config';
import authConfig from '@config/auth.config';

@Injectable()
export class AppService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
    private readonly configService: ConfigService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getDatabaseUrl(): string {
    const url = this.configService.get<string>('database.url');
    if (!url) {
      throw new Error('DATABASE_URL environment variable is not configured');
    }
    return url;
  }

  getAppPort(): number {
    return this.app.port;
  }

  getJwtSecret(): string {
    if (!this.auth.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not configured');
    }
    return this.auth.jwtSecret;
  }
}
