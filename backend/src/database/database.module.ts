import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from '../config/typeorm.config';
import { DbInitService } from './db-init.service';
import { IngestionBatch } from './entities/ingestion-batch.entity';
import { HobbyLobbyPOS } from './entities/hobby-lobby-pos.entity';
import { FiveBelowPOS } from './entities/five-below-pos.entity';
import { KohlsPOS } from './entities/kohls-pos.entity';
import { MsiPOS } from './entities/msi-pos.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        const initService = new DbInitService();
        await initService.ensureDatabaseExists();
        return getTypeOrmConfig();
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
