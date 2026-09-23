import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HobbyLobbyPOS } from '../../database/entities/hobby-lobby-pos.entity';
import { IngestionBatch } from '../../database/entities/ingestion-batch.entity';
import { HobbyLobbyService } from './hobby-lobby.service';
import { HobbyLobbyController } from './hobby-lobby.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HobbyLobbyPOS, IngestionBatch])],
  controllers: [HobbyLobbyController],
  providers: [HobbyLobbyService],
  exports: [HobbyLobbyService],
})
export class HobbyLobbyModule {}
