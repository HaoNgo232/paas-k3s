import { Injectable, Inject } from '@nestjs/common';
import { ConfigService, type ConfigType } from '@nestjs/config';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';

@Injectable()
export class AppService {
  constructor(
    @Inject(appConfig.KEY)
    private app: ConfigType<typeof appConfig>,
    @Inject(authConfig.KEY)
    private auth: ConfigType<typeof authConfig>,
    private configService: ConfigService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getDatabaseUrl(): string {
    return this.configService.get<string>('database.url')!;
  }

  getAppPort(): number {
    return this.app.port;
  }

  getJwtSecret(): string {
    return this.auth.jwtSecret!;
  }
}
