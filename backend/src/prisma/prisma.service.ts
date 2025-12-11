import type { ConfigType } from '@nestjs/config';
import { Injectable, Inject } from '@nestjs/common';
import databaseConfig from '@config/database.config';

@Injectable()
export class PrismaService {
  constructor(
    @Inject(databaseConfig.KEY)
    private dbConfig: ConfigType<typeof databaseConfig>,
  ) {}

  // Prisma initialization logic will go here
}
