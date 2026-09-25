import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Preload env vars from possible locations
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

@Injectable()
export class DbInitService {
  private readonly logger = new Logger('DatabaseInit');

  async ensureDatabaseExists(): Promise<void> {
    const host = process.env.DW_HOST || 'localhost';
    const port = parseInt(process.env.DW_PORT || '5432', 10);
    const user = process.env.DW_USER || 'postgres';
    const password = process.env.DW_PASSWORD || '0006';
    const targetDb = process.env.DW_NAME || 'report_portal_db';

    this.logger.log(`Checking database connection on ${host}:${port} as user "${user}"...`);

    const client = new Client({
      host,
      port,
      user,
      password,
      database: 'postgres',
    });

    try {
      await client.connect();
      const checkRes = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [targetDb],
      );

      if (checkRes.rowCount === 0) {
        this.logger.log(`Database "${targetDb}" does not exist. Creating now...`);
        const safeName = targetDb.replace(/"/g, '""');
        await client.query(`CREATE DATABASE "${safeName}"`);
        this.logger.log(`Database "${targetDb}" created successfully.`);
      } else {
        this.logger.log(`Database "${targetDb}" already exists and is ready.`);
      }
    } catch (err: any) {
      this.logger.error(`Database initialization error: ${err.message}`, err.stack);
    } finally {
      await client.end().catch(() => {});
    }
  }
}

