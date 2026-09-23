import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MsiPOS } from '../../database/entities/msi-pos.entity';
import { IngestionBatch } from '../../database/entities/ingestion-batch.entity';
import { MsiService } from './msi.service';
import { MsiController } from './msi.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MsiPOS, IngestionBatch])],
  controllers: [MsiController],
  providers: [MsiService],
  exports: [MsiService],
})
export class MsiModule {}
