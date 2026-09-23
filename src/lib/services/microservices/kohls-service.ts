// Microservice 3: Kohl's POS Service
// Decoupled backend component for Kohl's EDI 852 POS Ingestion, Inventory & Sales Tracking.
// Supports Upserts, Deduplication, and Store Aggregations.

import { KohlsRow, IngestionBatchRecord, ParseResult } from '@/lib/types/pos';
import { parseKohlsCSV } from '@/lib/parsers/kohls-parser';

export interface KohlsFilterParams {
  storeNumber?: string;
  sku?: string;
  department?: string;
}

export class KohlsMicroservice {
  private serviceUrl: string | undefined;
  private rows: Array<KohlsRow & { id: string; batchId: string; uploadedBy: string; uploadedAt: string; createdAt: string }> = [];
  private batches: IngestionBatchRecord[] = [];

  constructor() {
    this.serviceUrl = process.env.KOHLS_SERVICE_URL;
  }

  public async processUpload(params: {
    fileContent: string;
    fileName: string;
    uploadedBy?: string;
  }): Promise<{ batch: IngestionBatchRecord; parseResult: ParseResult<KohlsRow> }> {
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
        console.warn(`[KohlsMicroservice] Remote service failed (${response.statusText}), using local execution fallback.`);
      } catch (err) {
        console.warn(`[KohlsMicroservice] Remote service connection error:`, err);
      }
    }

    // Local execution with Upserts & Deduplication
    const { fileContent, fileName, uploadedBy = 'portal_user' } = params;
    const batchId = `kh_batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const parseResult = parseKohlsCSV(fileContent);

    if (parseResult.success) {
      parseResult.data.forEach((parsedRow, idx) => {
        const rowKey = `${parsedRow.storeNumber}_${parsedRow.sku}_${parsedRow.weekEndDate || ''}`;
        const existingIdx = this.rows.findIndex((r) => {
          const k = `${r.storeNumber}_${r.sku}_${r.weekEndDate || ''}`;
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
            id: `kh_${batchId}_${idx}`,
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
      retailerCode: 'KOHLS',
      fileName,
      fileSizeBytes: Buffer.byteLength(fileContent, 'utf8'),
      reportFamily: null,
      departmentTag: parseResult.detectedDepartments.length > 0 ? parseResult.detectedDepartments.join(', ') : 'All',
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

  public async getData(filters?: KohlsFilterParams): Promise<Array<KohlsRow & { uploadedBy: string; uploadedAt: string }>> {
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
        console.warn(`[KohlsMicroservice] Remote fetch failed, falling back to local store:`, err);
      }
    }

    return this.rows.filter((r) => {
      if (filters?.storeNumber && r.storeNumber !== filters.storeNumber) return false;
      if (filters?.sku && !r.sku.toLowerCase().includes(filters.sku.toLowerCase())) return false;
      if (filters?.department && r.department && !r.department.toLowerCase().includes(filters.department.toLowerCase())) return false;
      return true;
    });
  }

  public getBatches(): IngestionBatchRecord[] {
    return this.batches;
  }

  public getMetrics() {
    const totalSales = this.rows.reduce((acc, r) => acc + (r.posDollars || 0), 0);
    const inventoryUnits = this.rows.reduce((acc, r) => acc + (r.storeOHUnits || 0), 0);
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

const globalKH = global as unknown as { __kohlsService?: KohlsMicroservice };
export const kohlsService = globalKH.__kohlsService || new KohlsMicroservice();
if (process.env.NODE_ENV !== 'production') {
  globalKH.__kohlsService = kohlsService;
}
