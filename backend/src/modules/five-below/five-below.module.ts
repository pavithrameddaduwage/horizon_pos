import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiveBelowPOS } from '../../database/entities/five-below-pos.entity';
import { IngestionBatch } from '../../database/entities/ingestion-batch.entity';
import { FiveBelowService } from './five-below.service';
import { FiveBelowController } from './five-below.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FiveBelowPOS, IngestionBatch])],
  controllers: [FiveBelowController],
  providers: [FiveBelowService],
  exports: [FiveBelowService],
})
export class FiveBelowModule {}
