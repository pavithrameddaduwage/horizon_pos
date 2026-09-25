import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { IngestionBatch } from '../database/entities/ingestion-batch.entity';
import { HobbyLobbyPOS } from '../database/entities/hobby-lobby-pos.entity';
import { FiveBelowPOS } from '../database/entities/five-below-pos.entity';
import { KohlsPOS } from '../database/entities/kohls-pos.entity';
import { MsiPOS } from '../database/entities/msi-pos.entity';

// Preload env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export function getTypeOrmConfig(): TypeOrmModuleOptions {
  const host = process.env.DW_HOST || 'localhost';
  const port = parseInt(process.env.DW_PORT || '5432', 10);
  const username = process.env.DW_USER || 'postgres';
  const password = process.env.DW_PASSWORD || '0006';
  const database = process.env.DW_NAME || 'report_portal_db';


  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: [IngestionBatch, HobbyLobbyPOS, FiveBelowPOS, KohlsPOS, MsiPOS],
    synchronize: true, // Automatically synchronize schema
    logging: false,
    extra: {
      max: 20,
      connectionTimeoutMillis: 10000,
    },
  };
}
