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
  const host = process.env.DW_HOST || 'localhost';
  const port = parseInt(process.env.DW_PORT || '5432', 10);
  const user = process.env.DW_USER || 'postgres';
  const password = process.env.DW_PASSWORD || '';
  const database = process.env.DW_NAME;

  console.log('\n====================================================');
  console.log(' [HORIZON POS] 🚀 Booting Horizon POS Backend');
  console.log(` [HORIZON POS] DW_HOST:      ${host}`);
  console.log(` [HORIZON POS] DW_PORT:      ${port}`);
  console.log(` [HORIZON POS] DW_USER:      ${user}`);
  console.log(` [HORIZON POS] DW_NAME:      ${database}`);
  console.log('====================================================\n');

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
  console.log(`\n [HORIZON POS] ✅ Server listening on http://localhost:${appPort}\n`);
}

bootstrap();



