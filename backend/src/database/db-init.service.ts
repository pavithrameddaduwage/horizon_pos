import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from 'pg';

@Injectable()
export class DbInitService {
  private readonly logger = new Logger('DatabaseInit');

  async ensureDatabaseExists(): Promise<void> {
    const host = process.env.DW_HOST || 'localhost';
    const port = parseInt(process.env.DW_PORT || '5432', 10);
    const user = process.env.DW_USER || 'postgres';
    const password = process.env.DW_PASSWORD || '0006';
    const targetDb = process.env.DW_NAME || 'report_portal_db';

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
        // Identifier cannot be parameterized with $1 in CREATE DATABASE, must be quoted
        const safeName = targetDb.replace(/"/g, '""');
        await client.query(`CREATE DATABASE "${safeName}"`);
        this.logger.log(`Database "${targetDb}" created successfully.`);
      } else {
        this.logger.log(`Database "${targetDb}" verified.`);
      }
    } catch (err: any) {
      this.logger.warn(`Database verification notice: ${err.message}`);
    } finally {
      await client.end().catch(() => {});
    }
  }
}
