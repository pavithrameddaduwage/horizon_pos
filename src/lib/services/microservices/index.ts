// Microservices Orchestrator & Client Gateway Registry
// Connects the Next.js Portal (BFF) to the 4 isolated POS microservices.

import { RetailerCode, FiveBelowFamily, IngestionBatchRecord } from '@/lib/types/pos';
import { hobbyLobbyService } from './hobby-lobby-service';
import { fiveBelowService } from './five-below-service';
import { kohlsService } from './kohls-service';
import { msiService } from './msi-service';
import { prisma } from '@/lib/prisma';
import { verifyAndInitDatabase } from '@/lib/db-init';

export { hobbyLobbyService } from './hobby-lobby-service';
export { fiveBelowService } from './five-below-service';
export { kohlsService } from './kohls-service';
export { msiService } from './msi-service';

class POSMicroserviceGateway {
  public autoDetectRetailer(fileContent: string, fileName?: string): { retailer: RetailerCode; family?: FiveBelowFamily } {
    const fn = (fileName || '').toLowerCase();
    const firstLine = fileContent.split('\n')[0].toLowerCase();

    if (fn.includes('hobby') || firstLine.includes('buyer number') || firstLine.includes('2 yr sales') || firstLine.includes('ly jan sales')) {
      return { retailer: 'HOBBY_LOBBY' };
    }
    if (fn.includes('kohl') || firstLine.includes('store #') || firstLine.includes('pos units') || firstLine.includes('regular units')) {
      return { retailer: 'KOHLS' };
    }
    if (fn.includes('msi') || fn.includes('mis') || firstLine.includes('receipt number') || firstLine.includes('tender type') || firstLine.includes('register id')) {
      return { retailer: 'MSI' };
    }
    if (fn.includes('five') || firstLine.includes('gtin') || firstLine.includes('inner case pack') || firstLine.includes('sales u wtd') || firstLine.includes('dc no#')) {
      return { retailer: 'FIVE_BELOW' };
    }

    return { retailer: 'HOBBY_LOBBY' };
  }

  public async routeUpload(params: {
    fileContent: string;
    fileName: string;
    retailerOverride?: RetailerCode;
    familyOverride?: FiveBelowFamily;
    departmentOverride?: string;
    uploadedBy?: string;
  }) {
    await verifyAndInitDatabase();

    let effectiveRetailer = params.retailerOverride;
    let effectiveFamily = params.familyOverride;

    if (!effectiveRetailer) {
      const detected = this.autoDetectRetailer(params.fileContent, params.fileName);
      effectiveRetailer = detected.retailer;
      effectiveFamily = effectiveFamily || detected.family;
    }

    if (effectiveRetailer === 'MIS') {
      effectiveRetailer = 'MSI';
    }

    switch (effectiveRetailer) {
      case 'HOBBY_LOBBY':
        return await hobbyLobbyService.processUpload({
          fileContent: params.fileContent,
          fileName: params.fileName,
          uploadedBy: params.uploadedBy,
        });

      case 'FIVE_BELOW':
        return await fiveBelowService.processUpload({
          fileContent: params.fileContent,
          fileName: params.fileName,
          familyOverride: effectiveFamily,
          departmentOverride: params.departmentOverride,
          uploadedBy: params.uploadedBy,
        });

      case 'KOHLS':
        return await kohlsService.processUpload({
          fileContent: params.fileContent,
          fileName: params.fileName,
          uploadedBy: params.uploadedBy,
        });

      case 'MSI':
        return await msiService.processUpload({
          fileContent: params.fileContent,
          fileName: params.fileName,
          uploadedBy: params.uploadedBy,
        });

      default:
        throw new Error(`Unsupported retailer code: ${effectiveRetailer}`);
    }
  }

  public async getAllBatches(retailer?: RetailerCode): Promise<IngestionBatchRecord[]> {
    await verifyAndInitDatabase();

    try {
      let rCode = retailer;
      if (rCode === 'MIS') rCode = 'MSI';

      const dbBatches = await prisma.ingestionBatch.findMany({
        where: rCode ? { retailerCode: rCode as any } : undefined,
        orderBy: { uploadedAt: 'desc' },
      });

      if (dbBatches.length > 0) {
        return dbBatches.map((b) => ({
          id: b.id,
          retailerCode: b.retailerCode as any,
          fileName: b.fileName,
          fileSizeBytes: b.fileSizeBytes,
          reportFamily: b.reportFamily,
          departmentTag: b.departmentTag,
          totalRows: b.totalRows,
          validRows: b.validRows,
          errorRows: b.errorRows,
          status: b.status as any,
          errorSummary: (b.errorSummary as any) || null,
          uploadedBy: b.uploadedBy,
          uploadedAt: b.uploadedAt.toISOString(),
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
        }));
      }
    } catch {
      // fallback
    }

    const hlBatches = await hobbyLobbyService.getBatches();
    const fbBatches = await fiveBelowService.getBatches();
    const khBatches = await kohlsService.getBatches();
    const msiBatches = await msiService.getBatches();

    const all = [...hlBatches, ...fbBatches, ...khBatches, ...msiBatches].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!retailer) return all;
    let r = retailer;
    if (r === 'MIS') r = 'MSI';
    return all.filter((b) => b.retailerCode === r);
  }

  public async getAggregatedKPIs() {
    await verifyAndInitDatabase();

    const [hlMetrics, fbMetrics, khMetrics, msiMetrics] = await Promise.all([
      hobbyLobbyService.getMetrics(),
      fiveBelowService.getMetrics(),
      kohlsService.getMetrics(),
      msiService.getMetrics(),
    ]);

    const totalBatches = hlMetrics.batches + fbMetrics.batches + khMetrics.batches + msiMetrics.batches;
    const totalRowsIngested = hlMetrics.rows + fbMetrics.rows + khMetrics.rows + msiMetrics.rows;

    return {
      totalBatches,
      totalRowsIngested,
      retailerBreakdown: {
        HOBBY_LOBBY: hlMetrics,
        FIVE_BELOW: fbMetrics,
        KOHLS: khMetrics,
        MSI: msiMetrics,
        MIS: msiMetrics,
      },
    };
  }
}

const globalGateway = global as unknown as { __posGateway?: POSMicroserviceGateway };
export const posMicroserviceGateway = globalGateway.__posGateway || new POSMicroserviceGateway();
if (process.env.NODE_ENV !== 'production') {
  globalGateway.__posGateway = posMicroserviceGateway;
}
