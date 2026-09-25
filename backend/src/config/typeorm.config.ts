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
  return {
    type: 'postgres',
    host: process.env.DB_HOST || process.env.DW_HOST,
    port: (process.env.DB_PORT || process.env.DW_PORT) ? parseInt(process.env.DB_PORT || process.env.DW_PORT!, 10) : undefined,
    username: process.env.DB_USER || process.env.DW_USER,
    password: process.env.DB_PASSWORD || process.env.DW_PASSWORD || '',
    database: process.env.DB_NAME || process.env.DW_NAME,


    entities: [IngestionBatch, HobbyLobbyPOS, FiveBelowPOS, KohlsPOS, MsiPOS],
    synchronize: true, // Automatically synchronize schema and create all tables
    logging: false,
    extra: {
      max: 20,
      connectionTimeoutMillis: 10000,
    },
  };
}




