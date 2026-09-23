import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestionBatch } from '../../database/entities/ingestion-batch.entity';
import { HobbyLobbyPOS } from '../../database/entities/hobby-lobby-pos.entity';
import { FiveBelowPOS } from '../../database/entities/five-below-pos.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([IngestionBatch, HobbyLobbyPOS, FiveBelowPOS]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
