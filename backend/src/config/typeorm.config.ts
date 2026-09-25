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
  const host = process.env.DW_HOST;
  const port = process.env.DW_PORT ? parseInt(process.env.DW_PORT, 10) : undefined;
  const username = process.env.DW_USER;
  const password = process.env.DW_PASSWORD;
  const database = process.env.DW_NAME;

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: [IngestionBatch, HobbyLobbyPOS, FiveBelowPOS, KohlsPOS, MsiPOS],
    synchronize: true, // Automatically synchronize schema and create all tables
    logging: false,
    extra: {
      max: 20,
      connectionTimeoutMillis: 10000,
    },
  };
}



