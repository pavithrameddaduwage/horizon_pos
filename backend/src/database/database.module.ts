import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DbInitService } from './db-init.service';
import { IngestionBatch } from './entities/ingestion-batch.entity';
import { HobbyLobbyPOS } from './entities/hobby-lobby-pos.entity';
import { FiveBelowPOS } from './entities/five-below-pos.entity';
import { KohlsPOS } from './entities/kohls-pos.entity';
import { MsiPOS } from './entities/msi-pos.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {

        const host = configService.get<string>('DW_HOST') ?? process.env.DW_HOST;
        const port = configService.get<string>('DW_PORT')
          ? parseInt(String(configService.get<string>('DW_PORT')), 10)
          : (process.env.DW_PORT ? parseInt(String(process.env.DW_PORT), 10) : 5432);
        const username = configService.get<string>('DW_USER') ?? process.env.DW_USER;
        const rawPassword = configService.get<string>('DW_PASSWORD') ?? process.env.DW_PASSWORD;
        const password = String(rawPassword ?? '');
        const database = configService.get<string>('DW_NAME') ?? process.env.DW_NAME;

        const initService = new DbInitService();
        if (database && host && username) {
          // 1. Ensure the database exists on the PostgreSQL instance
          await initService.ensureDatabaseExists(host, port, username, password, database);
        }

        // 2. Return TypeORM configuration with auto-synchronize to create all tables
        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [IngestionBatch, HobbyLobbyPOS, FiveBelowPOS, KohlsPOS, MsiPOS],
          synchronize: true, // Automatically synchronize schema and create all tables
          logging: ['error', 'warn'],
          extra: {
            max: 20,
            connectionTimeoutMillis: 10000,
          },
        };

      },
    }),
    TypeOrmModule.forFeature([
      IngestionBatch,
      HobbyLobbyPOS,
      FiveBelowPOS,
      KohlsPOS,
      MsiPOS,
    ]),
  ],
  providers: [DbInitService],
  exports: [TypeOrmModule, DbInitService],
})
export class DatabaseModule {}

