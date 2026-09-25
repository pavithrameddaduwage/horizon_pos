import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Preload env vars from possible locations
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

@Injectable()
export class DbInitService {
  private readonly logger = new Logger('DatabaseInit');

  async ensureDatabaseExists(
    dbHost?: string,
    dbPort?: number,
    dbUser?: string,
    dbPassword?: string,
    dbName?: string,
  ): Promise<void> {
    const host = dbHost || process.env.DW_HOST;
    const port = dbPort || (process.env.DW_PORT ? parseInt(process.env.DW_PORT, 10) : undefined);
    const user = dbUser || process.env.DW_USER;
    const password = dbPassword ?? process.env.DW_PASSWORD ?? '';
    const targetDb = dbName || process.env.DW_NAME;




    if (!targetDb || !host || !user) {
      this.logger.warn('Database environment variables (DW_HOST, DW_USER, DW_NAME) are incomplete; skipping DB auto-creation check.');
      return;
    }

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
        this.logger.log(`Database "${targetDb}" does not exist. Creating...`);
        const safeName = targetDb.replace(/"/g, '""');
        await client.query(`CREATE DATABASE "${safeName}"`);
        this.logger.log(`Database "${targetDb}" created successfully.`);
      } else {
        this.logger.log(`Database "${targetDb}" verified.`);
      }
    } catch (err: any) {
      this.logger.error(`Database initialization error: ${err.message}`, err.stack);
      throw err;
    } finally {
      await client.end().catch(() => {});
    }
  }
}




