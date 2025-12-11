import type { ConfigType } from '@nestjs/config';
import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import databaseConfig from '@config/database.config';

/**
 * Prisma Service
 * Wrapper cho PrismaClient với lifecycle hooks
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject(databaseConfig.KEY)
    private readonly dbConfig: ConfigType<typeof databaseConfig>,
  ) {
    // Prisma 7.0 không hỗ trợ datasources trong constructor
    // DATABASE_URL phải được set qua environment variable
    // Type assertion cần thiết vì PrismaClientOptions yêu cầu adapter/accelerateUrl
    // nhưng runtime cho phép empty options khi dùng DATABASE_URL từ env
    super({} as never);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
