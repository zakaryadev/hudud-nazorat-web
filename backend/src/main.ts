import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { corsOrigin } from './common/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: corsOrigin(), credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  // Yuklangan fayllarni statik tarqatish: /uploads/<fayl>
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  app.useStaticAssets(resolve(uploadDir), { prefix: '/uploads/' });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`Backend ishga tushdi: http://localhost:${port}/api`);
}
bootstrap();
