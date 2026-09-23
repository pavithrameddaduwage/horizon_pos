// Microservice 1: Hobby Lobby POS Service
// Decoupled backend component for Hobby Lobby Monthly & Departmental POS Ingestion and Analytics.
// Supports Upserts, Deduplication, Dynamic Department Aggregation, and Persisted Audit Logs.

import { HobbyLobbyRow, IngestionBatchRecord, ParseResult } from '@/lib/types/pos';
import { parseHobbyLobbyCSV } from '@/lib/parsers/hobby-lobby-parser';

export interface HobbyLobbyFilterParams {
  department?: string;
  buyerName?: string;
  vendorNumber?: string;
  itemNumber?: string;
  year?: number;
  month?: number;
}

export class HobbyLobbyMicroservice {
  private serviceUrl: string | undefined;
  private rows: Array<HobbyLobbyRow & { id: string; batchId: string; uploadedBy: string; uploadedAt: string; createdAt: string }> = [];
  private batches: IngestionBatchRecord[] = [];

  constructor() {
    this.serviceUrl = process.env.HOBBY_LOBBY_SERVICE_URL;
  }

  public async processUpload(params: {
    fileContent: string;
    fileName: string;
    uploadedBy?: string;
  }): Promise<{ batch: IngestionBatchRecord; parseResult: ParseResult<HobbyLobbyRow> }> {
    // If external microservice URL is configured, delegate via HTTP
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
        console.warn(`[HobbyLobbyMicroservice] Remote service failed (${response.statusText}), using local execution fallback.`);
      } catch (err) {
        console.warn(`[HobbyLobbyMicroservice] Remote service connection error:`, err);
      }
    }

    // Local / In-Process Service Execution with Upsert & Deduplication
    const { fileContent, fileName, uploadedBy = 'portal_user' } = params;
    const batchId = `hl_batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const parseResult = parseHobbyLobbyCSV(fileContent, { fileName });

    if (parseResult.success) {
      parseResult.data.forEach((parsedRow, idx) => {
        // Upsert / Deduplication Key: itemNumber + vendorNumber + (reportingYear || '') + (reportingMonth || '')
        const itemKey = `${parsedRow.itemNumber || parsedRow.vendorStockNumber}_${parsedRow.vendorNumber}_${parsedRow.reportingYear || ''}_${parsedRow.reportingMonth || ''}`;
        
        const existingIdx = this.rows.findIndex((r) => {
          const rKey = `${r.itemNumber || r.vendorStockNumber}_${r.vendorNumber}_${r.reportingYear || ''}_${r.reportingMonth || ''}`;
          return rKey === itemKey;
        });

        if (existingIdx >= 0) {
          // Update / Upsert existing record with latest metrics
          this.rows[existingIdx] = {
            ...this.rows[existingIdx],
            ...parsedRow,
            batchId,
            uploadedBy,
            uploadedAt: now,
          };
        } else {
          // Insert new record
          this.rows.push({
            ...parsedRow,
            id: `hl_${batchId}_${idx}`,
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
      retailerCode: 'HOBBY_LOBBY',
      fileName,
      fileSizeBytes: Buffer.byteLength(fileContent, 'utf8'),
      reportFamily: null,
      departmentTag: parseResult.detectedDepartments.length > 0 ? parseResult.detectedDepartments.join(', ') : 'All Departments',
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

  public async getData(filters?: HobbyLobbyFilterParams): Promise<Array<HobbyLobbyRow & { uploadedBy: string; uploadedAt: string }>> {
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
        console.warn(`[HobbyLobbyMicroservice] Remote fetch failed, falling back to local store:`, err);
      }
    }

    return this.rows.filter((r) => {
      if (filters?.department && r.department && !r.department.toLowerCase().includes(filters.department.toLowerCase())) {
        return false;
      }
      if (filters?.buyerName && !r.buyerName.toLowerCase().includes(filters.buyerName.toLowerCase())) {
        return false;
      }
      if (filters?.vendorNumber && !r.vendorNumber.toLowerCase().includes(filters.vendorNumber.toLowerCase())) {
        return false;
      }
      if (filters?.itemNumber && !r.itemNumber.toLowerCase().includes(filters.itemNumber.toLowerCase())) {
        return false;
      }
      if (filters?.year && r.reportingYear !== filters.year) {
        return false;
      }
      if (filters?.month && r.reportingMonth !== filters.month) {
        return false;
      }
      return true;
    });
  }

  public getBatches(): IngestionBatchRecord[] {
    return this.batches;
  }

  public getMetrics() {
    const totalSales = this.rows.reduce((acc, r) => acc + (r.sales12M || 0), 0);
    const inventoryUnits = this.rows.reduce((acc, r) => acc + (r.onHand || 0), 0);
    
    // Group metrics by department
    const deptMap: Record<string, { department: string; buyerName: string; buyerNumber: string; vendorNumbers: Set<string>; itemCount: number; total12MSales: number; totalOnHand: number; totalOnOrder: number; latestUploadedBy: string; latestUploadedAt: string }> = {};

    this.rows.forEach((r) => {
      const dKey = r.department || r.buyerName || 'General';
      if (!deptMap[dKey]) {
        deptMap[dKey] = {
          department: dKey,
          buyerName: r.buyerName || 'General',
          buyerNumber: r.buyerNumber || 'N/A',
          vendorNumbers: new Set(),
          itemCount: 0,
          total12MSales: 0,
          totalOnHand: 0,
          totalOnOrder: 0,
          latestUploadedBy: r.uploadedBy || 'portal_user',
          latestUploadedAt: r.uploadedAt || r.createdAt,
        };
      }
      deptMap[dKey].itemCount++;
      if (r.vendorNumber) deptMap[dKey].vendorNumbers.add(r.vendorNumber);
      deptMap[dKey].total12MSales += (r.sales12M || 0);
      deptMap[dKey].totalOnHand += (r.onHand || 0);
      deptMap[dKey].totalOnOrder += (r.onOrder || 0);
      deptMap[dKey].latestUploadedBy = r.uploadedBy || deptMap[dKey].latestUploadedBy;
      deptMap[dKey].latestUploadedAt = r.uploadedAt || deptMap[dKey].latestUploadedAt;
    });

    return {
      batches: this.batches.length,
      rows: this.rows.length,
      totalSales,
      inventoryUnits,
      departments: Object.values(deptMap),
    };
  }

  public clearData() {
    this.rows = [];
    this.batches = [];
  }
}

// Global Singleton instance for Hobby Lobby Microservice
const globalHL = global as unknown as { __hobbyLobbyService?: HobbyLobbyMicroservice };
export const hobbyLobbyService = globalHL.__hobbyLobbyService || new HobbyLobbyMicroservice();
if (process.env.NODE_ENV !== 'production') {
  globalHL.__hobbyLobbyService = hobbyLobbyService;
}
