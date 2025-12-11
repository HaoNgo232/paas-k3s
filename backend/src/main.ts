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
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  console.log('Application is running on: ', app.getUrl());
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
