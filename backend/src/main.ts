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

import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('Application is running on: ', app.getUrl());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
