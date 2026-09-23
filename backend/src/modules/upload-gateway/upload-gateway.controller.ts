import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadGatewayService } from './upload-gateway.service';
import { RetailerCode } from '../../database/entities/ingestion-batch.entity';

@Controller('api/v1/pos/upload')
export class UploadGatewayController {
  constructor(private readonly uploadGatewayService: UploadGatewayService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body() body: any = {},
  ) {
    let content: string = '';
    let fileName: string = '';
    let fileSizeBytes: number = 0;

    if (file && file.buffer) {
      content = file.buffer.toString('utf-8');
      fileName = file.originalname || 'uploaded_pos.csv';
      fileSizeBytes = file.size || Buffer.byteLength(content, 'utf-8');
    } else if (body.fileContent || body.csvContent) {
      content = body.fileContent || body.csvContent;
      fileName = body.fileName || 'pos_upload.csv';
      fileSizeBytes = Buffer.byteLength(content, 'utf-8');
    } else {
      throw new BadRequestException('No file or CSV content provided.');
    }

    const retailerCode = body.retailerCode || body.retailer;
    const familyOverride = body.familyOverride || body.family;
    const departmentTag = body.departmentTag || body.department;
    const vendorNumber = body.vendorNumber || body.vendorTag || body.vendor;
    const uploadedBy = body.uploadedBy || 'portal_user';

    return this.uploadGatewayService.processUpload(
      content,
      fileName,
      fileSizeBytes,
      retailerCode && retailerCode !== 'AUTO' ? retailerCode : undefined,
      uploadedBy,
      familyOverride && familyOverride !== 'AUTO' ? familyOverride : undefined,
      departmentTag && departmentTag.trim().length > 0 ? departmentTag.trim() : undefined,
      vendorNumber && vendorNumber.trim().length > 0 ? vendorNumber.trim() : undefined,
    );
  }
}
