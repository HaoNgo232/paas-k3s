import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configs } from '@config/index';
import { validationSchema } from '@config/validation.schema';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from '@modules/auth/auth.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV ? `.env.${ENV}` : '.env.development',
      load: configs,
      cache: true,
      expandVariables: true,
      validationSchema,
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
