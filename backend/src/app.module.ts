import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { DatabaseModule } from './database/database.module';
import { HobbyLobbyModule } from './modules/hobby-lobby/hobby-lobby.module';
import { FiveBelowModule } from './modules/five-below/five-below.module';
import { KohlsModule } from './modules/kohls/kohls.module';
import { MsiModule } from './modules/msi/msi.module';
import { UploadGatewayModule } from './modules/upload-gateway/upload-gateway.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../.env'),
        path.resolve(__dirname, '../../.env'),
        path.resolve(__dirname, '../.env'),
      ],
    }),
    DatabaseModule,
    HobbyLobbyModule,
    FiveBelowModule,
    KohlsModule,
    MsiModule,
    UploadGatewayModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}

