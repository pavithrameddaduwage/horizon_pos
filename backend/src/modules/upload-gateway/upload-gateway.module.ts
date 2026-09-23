import { Module } from '@nestjs/common';
import { UploadGatewayController } from './upload-gateway.controller';
import { UploadGatewayService } from './upload-gateway.service';
import { HobbyLobbyModule } from '../hobby-lobby/hobby-lobby.module';
import { FiveBelowModule } from '../five-below/five-below.module';
import { KohlsModule } from '../kohls/kohls.module';
import { MsiModule } from '../msi/msi.module';

@Module({
  imports: [HobbyLobbyModule, FiveBelowModule, KohlsModule, MsiModule],
  controllers: [UploadGatewayController],
  providers: [UploadGatewayService],
  exports: [UploadGatewayService],
})
export class UploadGatewayModule {}
