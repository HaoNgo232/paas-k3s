import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthModule } from '@modules/auth/auth.module';
import { SpacesController } from '@/modules/spaces/spaces.controller';
import { SpacesService } from '@/modules/spaces/spaces.service';

/**
 * Spaces Module
 * Quản lý Spaces (workspace) của user, mỗi Space tương ứng với 1 K3s Namespace
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SpacesController],
  providers: [SpacesService, PrismaService],
  exports: [SpacesService], // Export để các module khác có thể dùng
})
export class SpacesModule {}
