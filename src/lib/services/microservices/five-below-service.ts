// Microservice 2: Five Below POS Service
// Decoupled backend component for Five Below Multi-Family POS Ingestion, Sell-Through, and Analytics.
// Supports Upserts, Deduplication, and Dynamic Family Filtering.

import { FiveBelowRow, FiveBelowFamily, IngestionBatchRecord, ParseResult } from '@/lib/types/pos';
import { parseFiveBelowCSV } from '@/lib/parsers/five-below-parser';

export interface FiveBelowFilterParams {
  reportFamily?: string;
  department?: string;
  sku?: string;
}

export class FiveBelowMicroservice {
  private serviceUrl: string | undefined;
  private rows: Array<FiveBelowRow & { id: string; batchId: string; uploadedBy: string; uploadedAt: string; createdAt: string }> = [];
  private batches: IngestionBatchRecord[] = [];

  constructor() {
    this.serviceUrl = process.env.FIVE_BELOW_SERVICE_URL;
  }

  public async processUpload(params: {
    fileContent: string;
    fileName: string;
    familyOverride?: FiveBelowFamily;
    departmentOverride?: string;
    uploadedBy?: string;
  }): Promise<{ batch: IngestionBatchRecord; parseResult: ParseResult<FiveBelowRow> }> {
    if (this.serviceUrl) {
      try {
        const response = await fetch(`${this.serviceUrl}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SERVICE_API_KEY || ''}`,
          },
          body: JSON.stringify(params),
        });
        if (response.ok) {
          return await response.json();
        }
        console.warn(`[FiveBelowMicroservice] Remote service failed (${response.statusText}), using local execution fallback.`);
      } catch (err) {
        console.warn(`[FiveBelowMicroservice] Remote service connection error:`, err);
      }
    }

    // Local execution with Upserts & Deduplication
    const { fileContent, fileName, familyOverride, departmentOverride, uploadedBy = 'portal_user' } = params;
    const batchId = `fb_batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const parseResult = parseFiveBelowCSV(fileContent, { familyOverride, fileName });

    if (parseResult.success) {
      parseResult.data.forEach((parsedRow, idx) => {
        const rowKey = `${parsedRow.reportFamily}_${parsedRow.sku || parsedRow.gtin || parsedRow.styleId}_${parsedRow.reportDate || ''}`;
        const existingIdx = this.rows.findIndex((r) => {
          const k = `${r.reportFamily}_${r.sku || r.gtin || r.styleId}_${r.reportDate || ''}`;
          return k === rowKey;
        });

        if (existingIdx >= 0) {
          this.rows[existingIdx] = {
            ...this.rows[existingIdx],
            ...parsedRow,
            batchId,
            uploadedBy,
            uploadedAt: now,
          };
        } else {
          this.rows.push({
            ...parsedRow,
            id: `fb_${batchId}_${idx}`,
            batchId,
            uploadedBy,
            uploadedAt: now,
            createdAt: now,
          });
        }
      });
    }

    const batchRecord: IngestionBatchRecord = {
      id: batchId,
      retailerCode: 'FIVE_BELOW',
      fileName,
      fileSizeBytes: Buffer.byteLength(fileContent, 'utf8'),
      reportFamily: parseResult.detectedFamily || familyOverride || null,
      departmentTag: departmentOverride || (parseResult.detectedDepartments.length > 0 ? parseResult.detectedDepartments.join(', ') : 'All'),
      totalRows: parseResult.totalRows,
      validRows: parseResult.validRows,
      errorRows: parseResult.errorRows,
      status: parseResult.errorRows === 0 ? 'COMPLETED' : parseResult.validRows > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED',
      errorSummary: parseResult.errors.length > 0 ? parseResult.errors : null,
      uploadedBy,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.batches.unshift(batchRecord);
    return { batch: batchRecord, parseResult };
  }

  public async getData(filters?: FiveBelowFilterParams): Promise<Array<FiveBelowRow & { uploadedBy: string; uploadedAt: string }>> {
    if (this.serviceUrl) {
      try {
        const query = new URLSearchParams(filters as Record<string, string>).toString();
        const response = await fetch(`${this.serviceUrl}/data?${query}`, {
          headers: { 'Authorization': `Bearer ${process.env.SERVICE_API_KEY || ''}` },
        });
        if (response.ok) {
          const json = await response.json();
          return json.data || json;
        }
      } catch (err) {
        console.warn(`[FiveBelowMicroservice] Remote fetch failed, falling back to local store:`, err);
      }
    }

    return this.rows.filter((r) => {
      if (filters?.reportFamily && r.reportFamily !== filters.reportFamily) return false;
      if (filters?.department && r.department && !r.department.toLowerCase().includes(filters.department.toLowerCase())) return false;
      if (filters?.sku && r.sku && !r.sku.toLowerCase().includes(filters.sku.toLowerCase())) return false;
      return true;
    });
  }

  public getBatches(): IngestionBatchRecord[] {
    return this.batches;
  }

  public getMetrics() {
    const totalSales = this.rows.reduce((acc, r) => acc + (r.salesDYTD || 0), 0);
    const inventoryUnits = this.rows.reduce((acc, r) => acc + (r.invOHU || 0), 0);
    return {
      batches: this.batches.length,
      rows: this.rows.length,
      totalSales,
      inventoryUnits,
    };
  }

  public clearData() {
    this.rows = [];
    this.batches = [];
  }
}

const globalFB = global as unknown as { __fiveBelowService?: FiveBelowMicroservice };
export const fiveBelowService = globalFB.__fiveBelowService || new FiveBelowMicroservice();
if (process.env.NODE_ENV !== 'production') {
  globalFB.__fiveBelowService = fiveBelowService;
}
