// Microservice 4: MSI POS Service
// Decoupled backend component for MSI Enterprise POS Register Ingestion, Multi-Store Aggregation, and Settlement.
// Supports Upserts, Deduplication, and Register Level Rollups.

import { MsiRow, IngestionBatchRecord, ParseResult } from '@/lib/types/pos';
import { parseMsiCSV } from '@/lib/parsers/msi-parser';

export interface MsiFilterParams {
  storeId?: string;
  registerId?: string;
  sku?: string;
  tenderType?: string;
}

export class MsiMicroservice {
  private serviceUrl: string | undefined;
  private rows: Array<MsiRow & { id: string; batchId: string; uploadedBy: string; uploadedAt: string; createdAt: string }> = [];
  private batches: IngestionBatchRecord[] = [];

  constructor() {
    this.serviceUrl = process.env.MSI_SERVICE_URL;
  }

  public async processUpload(params: {
    fileContent: string;
    fileName: string;
    uploadedBy?: string;
  }): Promise<{ batch: IngestionBatchRecord; parseResult: ParseResult<MsiRow> }> {
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
        console.warn(`[MsiMicroservice] Remote service failed (${response.statusText}), using local execution fallback.`);
      } catch (err) {
        console.warn(`[MsiMicroservice] Remote service connection error:`, err);
      }
    }

    // Local execution with Upserts & Deduplication
    const { fileContent, fileName, uploadedBy = 'portal_user' } = params;
    const batchId = `msi_batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const parseResult = parseMsiCSV(fileContent);

    if (parseResult.success) {
      parseResult.data.forEach((parsedRow, idx) => {
        const rowKey = `${parsedRow.storeId}_${parsedRow.registerId}_${parsedRow.receiptNumber}_${parsedRow.lineNumber}`;
        const existingIdx = this.rows.findIndex((r) => {
          const k = `${r.storeId}_${r.registerId}_${r.receiptNumber}_${r.lineNumber}`;
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
            id: `msi_${batchId}_${idx}`,
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
      retailerCode: 'MSI',
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

  public async getData(filters?: MsiFilterParams): Promise<Array<MsiRow & { uploadedBy: string; uploadedAt: string }>> {
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
        console.warn(`[MsiMicroservice] Remote fetch failed, falling back to local store:`, err);
      }
    }

    return this.rows.filter((r) => {
      if (filters?.storeId && r.storeId !== filters.storeId) return false;
      if (filters?.registerId && r.registerId !== filters.registerId) return false;
      if (filters?.sku && !r.sku.toLowerCase().includes(filters.sku.toLowerCase())) return false;
      if (filters?.tenderType && r.tenderType !== filters.tenderType) return false;
      return true;
    });
  }

  public getBatches(): IngestionBatchRecord[] {
    return this.batches;
  }

  public getMetrics() {
    const totalSales = this.rows.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    const totalUnits = this.rows.reduce((acc, r) => acc + (r.quantity || 0), 0);
    return {
      batches: this.batches.length,
      rows: this.rows.length,
      totalSales,
      totalUnits,
    };
  }

  public clearData() {
    this.rows = [];
    this.batches = [];
  }
}

const globalMSI = global as unknown as { __msiService?: MsiMicroservice };
export const msiService = globalMSI.__msiService || new MsiMicroservice();
if (process.env.NODE_ENV !== 'production') {
  globalMSI.__msiService = msiService;
}
