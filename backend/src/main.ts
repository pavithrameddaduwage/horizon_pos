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

async function bootstrap() {
  const logger = new Logger('HorizonBackend');
  
  console.log('\n====================================================');
  console.log(' [HORIZON POS] 🚀 Booting Horizon POS Backend');
  console.log(` [HORIZON POS] DW_HOST:      ${process.env.DW_HOST || 'localhost'}`);
  console.log(` [HORIZON POS] DW_PORT:      ${process.env.DW_PORT || '5432'}`);
  console.log(` [HORIZON POS] DW_USER:      ${process.env.DW_USER || 'postgres'}`);
  console.log(` [HORIZON POS] DW_NAME:      ${process.env.DW_NAME || 'report_portal_db'}`);
  console.log('====================================================\n');

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
  console.log(`\n [HORIZON POS] ✅ Server listening on http://localhost:${port}\n`);
}

bootstrap();

