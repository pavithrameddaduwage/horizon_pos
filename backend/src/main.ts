import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment from root .env and local .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function bootstrap() {
  const logger = new Logger('HorizonBackend');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.BACKEND_PORT || process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Horizon POS Microservices running on port ${port}`);
}

bootstrap();
