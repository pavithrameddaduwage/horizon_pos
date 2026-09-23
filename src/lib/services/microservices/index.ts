// Microservices Orchestrator & Client Gateway Registry
// Connects the Next.js Portal (BFF) to the 4 isolated POS microservices.

import { RetailerCode, FiveBelowFamily, IngestionBatchRecord } from '@/lib/types/pos';
import { hobbyLobbyService } from './hobby-lobby-service';
import { fiveBelowService } from './five-below-service';
import { kohlsService } from './kohls-service';
import { msiService } from './msi-service';
import {
  SAMPLE_HOBBY_LOBBY_CSV,
  SAMPLE_FIVE_BELOW_TOYS_CSV,
  SAMPLE_FIVE_BELOW_PARTY_CSV,
  SAMPLE_FIVE_BELOW_BOOKS_CSV,
  SAMPLE_KOHLS_CSV,
  SAMPLE_MIS_CSV,
} from '@/lib/mock-data/sample-datasets';

export { hobbyLobbyService } from './hobby-lobby-service';
export { fiveBelowService } from './five-below-service';
export { kohlsService } from './kohls-service';
export { msiService } from './msi-service';

class POSMicroserviceGateway {
  private isInitialized = false;

  constructor() {
    this.initializeDefaultData();
  }

  public initializeDefaultData() {
    // Clean initial state - all data populated dynamically through user uploads
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

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
    let effectiveRetailer = params.retailerOverride;
    let effectiveFamily = params.familyOverride;

    if (!effectiveRetailer) {
      const detected = this.autoDetectRetailer(params.fileContent, params.fileName);
      effectiveRetailer = detected.retailer;
      effectiveFamily = effectiveFamily || detected.family;
    }

    // Support MIS as an alias for MSI
    if (effectiveRetailer === 'MIS') {
      effectiveRetailer = 'MSI';
    }

    // Strict routing to the dedicated microservice component
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

  public getAllBatches(retailer?: RetailerCode): IngestionBatchRecord[] {
    const all = [
      ...hobbyLobbyService.getBatches(),
      ...fiveBelowService.getBatches(),
      ...kohlsService.getBatches(),
      ...msiService.getBatches(),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (!retailer) return all;
    if (retailer === 'MIS') retailer = 'MSI';
    return all.filter((b) => b.retailerCode === retailer);
  }

  public getAggregatedKPIs() {
    const hlMetrics = hobbyLobbyService.getMetrics();
    const fbMetrics = fiveBelowService.getMetrics();
    const khMetrics = kohlsService.getMetrics();
    const msiMetrics = msiService.getMetrics();

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
        // Alias MIS for backward compatibility
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
