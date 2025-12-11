import * as path from 'node:path';
import * as moduleAlias from 'module-alias';

// Cấu hình aliases cho production
if (process.env.NODE_ENV === 'production') {
  moduleAlias.addAliases({
    '@': path.resolve(__dirname),
    '@config': path.resolve(__dirname, 'config'),
    '@modules': path.resolve(__dirname, 'modules'),
    '@common': path.resolve(__dirname, 'common'),
    '@kubernetes': path.resolve(__dirname, 'kubernetes'),
    '@prisma': path.resolve(__dirname, 'prisma'),
  });
}

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@/app.module';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Lấy ConfigService để đọc cấu hình
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('app.frontendUrl');

  // Cấu hình CORS
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Kích hoạt ValidationPipe toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các property không được định nghĩa trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu có property lạ
      transform: true, // Tự động convert types (VD: string -> number)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Kích hoạt ClassSerializerInterceptor toàn cục để áp dụng @Exclude/@Expose cho response
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Tự động wrap tất cả controller responses thành { data: T, statusCode: number }
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(process.env.PORT ?? 3001);
  console.log('Application is running on port:', process.env.PORT ?? 3001);
}
void bootstrap();
