import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment from root .env and local .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { DbInitService } from './database/db-init.service';

async function bootstrap() {
  const logger = new Logger('HorizonBackend');

  const host = process.env.DB_HOST || process.env.DW_HOST;
  const rawPort = process.env.DB_PORT || process.env.DW_PORT;
  const port = rawPort ? parseInt(String(rawPort), 10) : undefined;
  const user = process.env.DB_USER || process.env.DW_USER;
  const password = process.env.DB_PASSWORD || process.env.DW_PASSWORD || '';
  const database = process.env.DB_NAME || process.env.DW_NAME;


  if (database) {
    // Pre-boot: Ensure PostgreSQL database exists dynamically from .env
    const initService = new DbInitService();
    await initService.ensureDatabaseExists(host, port, user, password, database);
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const appPort = process.env.BACKEND_PORT || process.env.PORT || 4000;
  await app.listen(appPort);
  logger.log(`Horizon POS Microservices running on port ${appPort}`);
}

bootstrap();




