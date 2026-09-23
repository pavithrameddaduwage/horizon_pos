// POS Ingestion Core Service
// Handles batch orchestration, validation, dimensional linking, and in-memory/Postgres persistence.

import {
  IngestionBatchRecord,
  RetailerCode,
  HobbyLobbyRow,
  FiveBelowRow,
  KohlsRow,
  MisRow,
  ParseResult,
  FiveBelowFamily,
} from '../types/pos';
import { parseHobbyLobbyCSV } from '../parsers/hobby-lobby-parser';
import { parseFiveBelowCSV, detectFiveBelowFamily } from '../parsers/five-below-parser';
import { parseKohlsCSV } from '../parsers/kohls-parser';
import { parseMisCSV } from '../parsers/mis-parser';
import {
  SAMPLE_HOBBY_LOBBY_CSV,
  SAMPLE_FIVE_BELOW_TOYS_CSV,
  SAMPLE_FIVE_BELOW_PARTY_CSV,
  SAMPLE_FIVE_BELOW_BOOKS_CSV,
  SAMPLE_KOHLS_CSV,
  SAMPLE_MIS_CSV,
} from '../mock-data/sample-datasets';

// In-Memory Data Store (Persists during server lifecycle, fast, seamless fallback)
class IngestionDataStore {
  public batches: IngestionBatchRecord[] = [];
  public hobbyLobbyRows: Array<HobbyLobbyRow & { id: string; batchId: string; createdAt: string }> = [];
  public fiveBelowRows: Array<FiveBelowRow & { id: string; batchId: string; createdAt: string }> = [];
  public kohlsRows: Array<KohlsRow & { id: string; batchId: string; createdAt: string }> = [];
  public misRows: Array<MisRow & { id: string; batchId: string; createdAt: string }> = [];
  public departments: Array<{ id: string; retailerCode: RetailerCode; code: string; name: string; buyerName?: string }> = [];
  private isInitialized = false;

  constructor() {
    this.initializeDefaultData();
  }

  public initializeDefaultData() {
    if (this.isInitialized) return;

    // Seed Sample Hobby Lobby
    this.processUpload({
      fileContent: SAMPLE_HOBBY_LOBBY_CSV,
      fileName: 'Hobby_Lobby_Monthly_POS_2026_07.csv',
      retailerOverride: 'HOBBY_LOBBY',
      uploadedBy: 'system_demo',
    });

    // Seed Sample Five Below Toys
    this.processUpload({
      fileContent: SAMPLE_FIVE_BELOW_TOYS_CSV,
      fileName: 'Five_Below_Weekly_TOYS_2026_W29.csv',
      retailerOverride: 'FIVE_BELOW',
      familyOverride: 'TOY',
      uploadedBy: 'system_demo',
    });

    // Seed Sample Five Below Party
    this.processUpload({
      fileContent: SAMPLE_FIVE_BELOW_PARTY_CSV,
      fileName: 'Five_Below_Weekly_PARTY_GAG_2026_W29.csv',
      retailerOverride: 'FIVE_BELOW',
      familyOverride: 'PARTY_GAG',
      uploadedBy: 'system_demo',
    });

    // Seed Sample Five Below Books
    this.processUpload({
      fileContent: SAMPLE_FIVE_BELOW_BOOKS_CSV,
      fileName: 'Five_Below_Weekly_BOOKS_2026_W29.csv',
      retailerOverride: 'FIVE_BELOW',
      familyOverride: 'BOOKS',
      uploadedBy: 'system_demo',
    });

    // Seed Sample Kohl's
    this.processUpload({
      fileContent: SAMPLE_KOHLS_CSV,
      fileName: 'Kohls_EDI852_Weekly_POS_20260725.csv',
      retailerOverride: 'KOHLS',
      uploadedBy: 'system_demo',
    });

    // Seed Sample MIS
    this.processUpload({
      fileContent: SAMPLE_MIS_CSV,
      fileName: 'MIS_Enterprise_Register_POS_20260725.csv',
      retailerOverride: 'MIS',
      uploadedBy: 'system_demo',
    });

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
    if (fn.includes('mis') || firstLine.includes('receipt number') || firstLine.includes('tender type') || firstLine.includes('register id')) {
      return { retailer: 'MIS' };
    }
    if (fn.includes('five') || firstLine.includes('gtin') || firstLine.includes('inner case pack') || firstLine.includes('sales u wtd') || firstLine.includes('dc no#')) {
      const headers = firstLine.split(',');
      return { retailer: 'FIVE_BELOW', family: detectFiveBelowFamily(headers, fileName) };
    }

    return { retailer: 'HOBBY_LOBBY' }; // Default fallback
  }

  public processUpload(params: {
    fileContent: string;
    fileName: string;
    retailerOverride?: RetailerCode;
    familyOverride?: FiveBelowFamily;
    departmentOverride?: string;
    uploadedBy?: string;
  }): { batch: IngestionBatchRecord; parseResult: ParseResult<any> } {
    const { fileContent, fileName, retailerOverride, familyOverride, departmentOverride, uploadedBy = 'portal_user' } = params;

    let effectiveRetailer = retailerOverride;
    let effectiveFamily = familyOverride;

    if (!effectiveRetailer) {
      const detected = this.autoDetectRetailer(fileContent, fileName);
      effectiveRetailer = detected.retailer;
      effectiveFamily = effectiveFamily || detected.family;
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    let parseResult: ParseResult<any>;

    switch (effectiveRetailer) {
      case 'HOBBY_LOBBY': {
        parseResult = parseHobbyLobbyCSV(fileContent);
        if (parseResult.success) {
          parseResult.data.forEach((row: HobbyLobbyRow, idx: number) => {
            this.hobbyLobbyRows.push({
              ...row,
              id: `hl_${batchId}_${idx}`,
              batchId,
              createdAt: now,
            });
          });
        }
        break;
      }
      case 'FIVE_BELOW': {
        parseResult = parseFiveBelowCSV(fileContent, { familyOverride: effectiveFamily, fileName });
        if (parseResult.success) {
          parseResult.data.forEach((row: FiveBelowRow, idx: number) => {
            this.fiveBelowRows.push({
              ...row,
              id: `fb_${batchId}_${idx}`,
              batchId,
              createdAt: now,
            });
          });
        }
        break;
      }
      case 'KOHLS': {
        parseResult = parseKohlsCSV(fileContent);
        if (parseResult.success) {
          parseResult.data.forEach((row: KohlsRow, idx: number) => {
            this.kohlsRows.push({
              ...row,
              id: `kh_${batchId}_${idx}`,
              batchId,
              createdAt: now,
            });
          });
        }
        break;
      }
      case 'MIS': {
        parseResult = parseMisCSV(fileContent);
        if (parseResult.success) {
          parseResult.data.forEach((row: MisRow, idx: number) => {
            this.misRows.push({
              ...row,
              id: `mis_${batchId}_${idx}`,
              batchId,
              createdAt: now,
            });
          });
        }
        break;
      }
    }

    // Register departments
    parseResult.detectedDepartments.forEach((dept) => {
      if (!this.departments.find((d) => d.retailerCode === effectiveRetailer && d.name.toLowerCase() === dept.toLowerCase())) {
        this.departments.push({
          id: `dept_${Math.random().toString(36).slice(2, 7)}`,
          retailerCode: effectiveRetailer!,
          code: dept.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10),
          name: dept,
        });
      }
    });

    const batchRecord: IngestionBatchRecord = {
      id: batchId,
      retailerCode: effectiveRetailer,
      fileName,
      fileSizeBytes: Buffer.byteLength(fileContent, 'utf8'),
      reportFamily: parseResult.detectedFamily || effectiveFamily || null,
      departmentTag: departmentOverride || (parseResult.detectedDepartments.length > 0 ? parseResult.detectedDepartments.join(', ') : 'All'),
      totalRows: parseResult.totalRows,
      validRows: parseResult.validRows,
      errorRows: parseResult.errorRows,
      status: parseResult.errorRows === 0 ? 'COMPLETED' : parseResult.validRows > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED',
      errorSummary: parseResult.errors.length > 0 ? parseResult.errors : null,
      uploadedBy,
      createdAt: now,
      updatedAt: now,
    };

    this.batches.unshift(batchRecord);
    return { batch: batchRecord, parseResult };
  }

  public getBatches(retailer?: RetailerCode): IngestionBatchRecord[] {
    if (!retailer) return this.batches;
    return this.batches.filter((b) => b.retailerCode === retailer);
  }

  public getHobbyLobbyData(filters?: { buyerName?: string; vendorNumber?: string; itemNumber?: string; year?: number }) {
    return this.hobbyLobbyRows.filter((r) => {
      if (filters?.buyerName && !r.buyerName.toLowerCase().includes(filters.buyerName.toLowerCase())) return false;
      if (filters?.vendorNumber && !r.vendorNumber.toLowerCase().includes(filters.vendorNumber.toLowerCase())) return false;
      if (filters?.itemNumber && !r.itemNumber.toLowerCase().includes(filters.itemNumber.toLowerCase())) return false;
      if (filters?.year && r.reportingYear !== filters.year) return false;
      return true;
    });
  }

  public getFiveBelowData(filters?: { reportFamily?: string; department?: string; sku?: string }) {
    return this.fiveBelowRows.filter((r) => {
      if (filters?.reportFamily && r.reportFamily !== filters.reportFamily) return false;
      if (filters?.department && r.department && !r.department.toLowerCase().includes(filters.department.toLowerCase())) return false;
      if (filters?.sku && r.sku && !r.sku.toLowerCase().includes(filters.sku.toLowerCase())) return false;
      return true;
    });
  }

  public getKohlsData() {
    return this.kohlsRows;
  }

  public getMisData() {
    return this.misRows;
  }

  public getKPIs() {
    const totalBatches = this.batches.length;
    const totalRowsIngested = this.batches.reduce((acc, b) => acc + b.validRows, 0);

    // Hobby Lobby Aggregates
    const hlTotal12MSales = this.hobbyLobbyRows.reduce((acc, r) => acc + (r.sales12M || 0), 0);
    const hlTotalOnHand = this.hobbyLobbyRows.reduce((acc, r) => acc + (r.onHand || 0), 0);

    // Five Below Aggregates
    const fbTotalYTDSales = this.fiveBelowRows.reduce((acc, r) => acc + (r.salesDYTD || 0), 0);
    const fbTotalInvOH = this.fiveBelowRows.reduce((acc, r) => acc + (r.invOHU || 0), 0);

    // Kohl's Aggregates
    const khTotalDollars = this.kohlsRows.reduce((acc, r) => acc + (r.posDollars || 0), 0);

    // MIS Aggregates
    const misTotalDollars = this.misRows.reduce((acc, r) => acc + (r.totalAmount || 0), 0);

    return {
      totalBatches,
      totalRowsIngested,
      retailerBreakdown: {
        HOBBY_LOBBY: {
          batches: this.batches.filter((b) => b.retailerCode === 'HOBBY_LOBBY').length,
          rows: this.hobbyLobbyRows.length,
          totalSales: hlTotal12MSales,
          inventoryUnits: hlTotalOnHand,
        },
        FIVE_BELOW: {
          batches: this.batches.filter((b) => b.retailerCode === 'FIVE_BELOW').length,
          rows: this.fiveBelowRows.length,
          totalSales: fbTotalYTDSales,
          inventoryUnits: fbTotalInvOH,
        },
        KOHLS: {
          batches: this.batches.filter((b) => b.retailerCode === 'KOHLS').length,
          rows: this.kohlsRows.length,
          totalSales: khTotalDollars,
        },
        MIS: {
          batches: this.batches.filter((b) => b.retailerCode === 'MIS').length,
          rows: this.misRows.length,
          totalSales: misTotalDollars,
        },
      },
    };
  }
}

// Global Singleton Store Instance
const globalStore = global as unknown as { __posDataStore?: IngestionDataStore };
export const posDataStore = globalStore.__posDataStore || new IngestionDataStore();
if (process.env.NODE_ENV !== 'production') {
  globalStore.__posDataStore = posDataStore;
}
