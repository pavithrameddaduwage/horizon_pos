import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KohlsPOS } from '../../database/entities/kohls-pos.entity';
import { IngestionBatch } from '../../database/entities/ingestion-batch.entity';
import { KohlsService } from './kohls.service';
import { KohlsController } from './kohls.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KohlsPOS, IngestionBatch])],
  controllers: [KohlsController],
  providers: [KohlsService],
  exports: [KohlsService],
})
export class KohlsModule {}
