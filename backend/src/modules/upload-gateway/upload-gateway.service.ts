import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RetailerCode } from '../../database/entities/ingestion-batch.entity';
import { HobbyLobbyService } from '../hobby-lobby/hobby-lobby.service';
import { FiveBelowService } from '../five-below/five-below.service';
import { KohlsService } from '../kohls/kohls.service';
import { MsiService } from '../msi/msi.service';

@Injectable()
export class UploadGatewayService {
  private readonly logger = new Logger(UploadGatewayService.name);

  constructor(
    private readonly hobbyLobbyService: HobbyLobbyService,
    private readonly fiveBelowService: FiveBelowService,
    private readonly kohlsService: KohlsService,
    private readonly msiService: MsiService,
  ) {}

  detectRetailer(csvContent: string, fileName?: string): RetailerCode {
    const fn = (fileName || '').toLowerCase();
    const firstLines = csvContent.slice(0, 2000).toLowerCase();

    // Filename indicators
    if (fn.includes('hobby') || fn.includes('lobby') || fn.includes('dept 120') || fn.includes('hl_')) {
      return RetailerCode.HOBBY_LOBBY;
    }
    if (fn.includes('five') || fn.includes('below') || fn.includes('5below') || fn.includes('5_below') || fn.includes('fb_')) {
      return RetailerCode.FIVE_BELOW;
    }
    if (fn.includes('kohl') || fn.includes('kohls')) {
      return RetailerCode.KOHLS;
    }
    if (fn.includes('msi') || fn.includes('mis') || fn.includes('pos_terminal')) {
      return RetailerCode.MSI;
    }

    // Header content indicators
    if (firstLines.includes('selldown') || firstLines.includes('sell down') || firstLines.includes('preprice') || (firstLines.includes('buyer numb') && firstLines.includes('vendor numb'))) {
      return RetailerCode.HOBBY_LOBBY;
    }
    if (firstLines.includes('salesuwtd') || firstLines.includes('sales u wtd') || firstLines.includes('invohu') || firstLines.includes('inv oh u') || firstLines.includes('wohlcw') || firstLines.includes('woh lcw')) {
      return RetailerCode.FIVE_BELOW;
    }
    if (firstLines.includes('storeohunits') || firstLines.includes('markdowndollars') || firstLines.includes('posdollars') || firstLines.includes('pos units')) {
      return RetailerCode.KOHLS;
    }
    if (firstLines.includes('receiptnumber') || firstLines.includes('receipt number') || firstLines.includes('registerid') || firstLines.includes('register id')) {
      return RetailerCode.MSI;
    }

    // Default fallback to Hobby Lobby
    return RetailerCode.HOBBY_LOBBY;
  }

  async processUpload(
    csvContent: string,
    fileName: string,
    fileSizeBytes: number,
    retailerCodeOverride?: RetailerCode,
    uploadedBy: string = 'portal_user',
    familyOverride?: any,
    departmentOverride?: string,
    vendorOverride?: string,
    yearOverride?: number,
    monthOverride?: number,
  ) {
    const targetRetailer = retailerCodeOverride || this.detectRetailer(csvContent, fileName);
    this.logger.log(`Processing upload for retailer: ${targetRetailer}, file: ${fileName} (${fileSizeBytes} bytes), vendor: ${vendorOverride || 'auto'}, period: ${monthOverride || 'auto'}/${yearOverride || 'auto'}`);

    switch (targetRetailer) {
      case RetailerCode.HOBBY_LOBBY:
        return this.hobbyLobbyService.ingestCsv(
          csvContent,
          fileName,
          fileSizeBytes,
          uploadedBy,
          departmentOverride,
          vendorOverride,
          yearOverride,
          monthOverride,
        );

      case RetailerCode.FIVE_BELOW:
        return this.fiveBelowService.ingestCsv(csvContent, fileName, fileSizeBytes, familyOverride, uploadedBy);

      case RetailerCode.KOHLS:
        return this.kohlsService.ingestCsv(csvContent, fileName, fileSizeBytes, uploadedBy);

      case RetailerCode.MSI:
      case RetailerCode.MIS:
        return this.msiService.ingestCsv(csvContent, fileName, fileSizeBytes, uploadedBy);

      default:
        throw new BadRequestException(`Unsupported retailer code: ${targetRetailer}`);
    }
  }
}
