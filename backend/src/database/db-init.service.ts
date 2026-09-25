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

  async ensureDatabaseExists(): Promise<void> {
    const host = process.env.DW_HOST || 'localhost';
    const port = parseInt(process.env.DW_PORT || '5432', 10);
    const user = process.env.DW_USER || 'postgres';
    const password = process.env.DW_PASSWORD || '0006';
    const targetDb = process.env.DW_NAME || 'report_portal_db';

    console.log('\n====================================================');
    console.log(' [DB-INIT] 🔍 Checking Database Existence');
    console.log(` [DB-INIT] Host:       ${host}:${port}`);
    console.log(` [DB-INIT] User:       ${user}`);
    console.log(` [DB-INIT] Target DB:  ${targetDb}`);
    console.log('====================================================');

    const client = new Client({
      host,
      port,
      user,
      password,
      database: 'postgres',
    });

    try {
      console.log(` [DB-INIT] Connecting to postgres server at ${host}:${port}...`);
      await client.connect();
      console.log(` [DB-INIT] Connected to postgres server successfully.`);

      const checkRes = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [targetDb],
      );

      if (checkRes.rowCount === 0) {
        console.log(` [DB-INIT] ⚡ Database "${targetDb}" does NOT exist. Creating now...`);
        const safeName = targetDb.replace(/"/g, '""');
        await client.query(`CREATE DATABASE "${safeName}"`);
        console.log(` [DB-INIT] ✅ Database "${targetDb}" created successfully!`);
      } else {
        console.log(` [DB-INIT] ✅ Database "${targetDb}" already exists.`);
      }
    } catch (err: any) {
      console.error(` [DB-INIT] ❌ Error checking/creating database "${targetDb}":`, err.message);
      this.logger.error(`Database initialization error: ${err.message}`, err.stack);
      throw err;
    } finally {
      await client.end().catch(() => {});
    }
  }
}


