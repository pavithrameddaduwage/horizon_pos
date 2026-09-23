// Microservice 1: Hobby Lobby POS Service
// Decoupled backend component for Hobby Lobby Monthly & Departmental POS Ingestion and Analytics.
// Persists directly to PostgreSQL database with Upserts and Deduplication.

import { HobbyLobbyRow, IngestionBatchRecord, ParseResult } from '@/lib/types/pos';
import { parseHobbyLobbyCSV } from '@/lib/parsers/hobby-lobby-parser';
import { prisma } from '@/lib/prisma';
import { verifyAndInitDatabase } from '@/lib/db-init';

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
  private inMemoryRows: Array<HobbyLobbyRow & { id: string; batchId: string; uploadedBy: string; uploadedAt: string; createdAt: string }> = [];
  private inMemoryBatches: IngestionBatchRecord[] = [];

  constructor() {
    this.serviceUrl = process.env.HOBBY_LOBBY_SERVICE_URL;
  }

  public async processUpload(params: {
    fileContent: string;
    fileName: string;
    uploadedBy?: string;
  }): Promise<{ batch: IngestionBatchRecord; parseResult: ParseResult<HobbyLobbyRow> }> {
    await verifyAndInitDatabase();

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
      } catch (err) {
        console.warn(`[HobbyLobbyMicroservice] Remote service error, using local DB:`, err);
      }
    }

    const { fileContent, fileName, uploadedBy = 'portal_user' } = params;
    const batchId = `hl_batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();

    const parseResult = parseHobbyLobbyCSV(fileContent, { fileName });

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
      uploadedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // 1. Try to persist into PostgreSQL via Prisma
    try {
      await prisma.ingestionBatch.create({
        data: {
          id: batchId,
          retailerCode: 'HOBBY_LOBBY',
          fileName,
          fileSizeBytes: batchRecord.fileSizeBytes,
          reportFamily: null,
          departmentTag: batchRecord.departmentTag,
          totalRows: batchRecord.totalRows,
          validRows: batchRecord.validRows,
          errorRows: batchRecord.errorRows,
          status: batchRecord.status as any,
          errorSummary: (batchRecord.errorSummary as any) || undefined,
          uploadedBy,
          uploadedAt: now,
        },
      });

      if (parseResult.success && parseResult.data.length > 0) {
        const rowsToInsert = parseResult.data.map((r, idx) => ({
          id: `hl_${batchId}_${idx}`,
          batchId,
          company: r.company || null,
          vendorNumber: r.vendorNumber || 'UNKNOWN',
          vendorName: r.vendorName || 'UNKNOWN',
          buyerNumber: r.buyerNumber || 'UNKNOWN',
          buyerName: r.buyerName || 'UNKNOWN',
          department: r.department || (r.buyerNumber ? `Dept ${r.buyerNumber} - ${r.buyerName}` : null),
          itemNumber: r.itemNumber,
          itemDescription: r.itemDescription,
          vendorStockNumber: r.vendorStockNumber || null,
          size: r.size || null,
          color: r.color || null,
          sellDown: r.sellDown,
          onHand: r.onHand,
          onOrder: r.onOrder,
          firstCost: r.firstCost,
          preprice: r.preprice,
          retailPrice: r.retailPrice,
          sales2Yr: r.sales2Yr,
          salesLY: r.salesLY,
          sales12M: r.sales12M,
          monthlySalesLY: (r.monthlySalesLY as any) || undefined,
          monthlySalesCY: (r.monthlySalesCY as any) || undefined,
          reportingYear: r.reportingYear || null,
          reportingMonth: r.reportingMonth || null,
          uploadedBy,
          uploadedAt: now,
        }));

        await prisma.hobbyLobbyPOS.createMany({
          data: rowsToInsert,
          skipDuplicates: true,
        });
      }
    } catch (dbErr: any) {
      console.warn('[HobbyLobbyMicroservice] DB insert fallback to memory:', dbErr?.message || dbErr);
    }

    // 2. Keep in-memory cache synchronized
    if (parseResult.success) {
      parseResult.data.forEach((parsedRow, idx) => {
        const itemKey = `${parsedRow.itemNumber || parsedRow.vendorStockNumber}_${parsedRow.vendorNumber}_${parsedRow.reportingYear || ''}_${parsedRow.reportingMonth || ''}`;
        const existingIdx = this.inMemoryRows.findIndex((r) => {
          const rKey = `${r.itemNumber || r.vendorStockNumber}_${r.vendorNumber}_${r.reportingYear || ''}_${r.reportingMonth || ''}`;
          return rKey === itemKey;
        });

        if (existingIdx >= 0) {
          this.inMemoryRows[existingIdx] = {
            ...this.inMemoryRows[existingIdx],
            ...parsedRow,
            batchId,
            uploadedBy,
            uploadedAt: now.toISOString(),
          };
        } else {
          this.inMemoryRows.push({
            ...parsedRow,
            id: `hl_${batchId}_${idx}`,
            batchId,
            uploadedBy,
            uploadedAt: now.toISOString(),
            createdAt: now.toISOString(),
          });
        }
      });
    }

    this.inMemoryBatches.unshift(batchRecord);
    return { batch: batchRecord, parseResult };
  }

  public async getData(filters?: HobbyLobbyFilterParams): Promise<Array<HobbyLobbyRow & { uploadedBy: string; uploadedAt: string }>> {
    await verifyAndInitDatabase();

    try {
      const dbRows = await prisma.hobbyLobbyPOS.findMany({
        where: {
          department: filters?.department ? { contains: filters.department, mode: 'insensitive' } : undefined,
          buyerName: filters?.buyerName ? { contains: filters.buyerName, mode: 'insensitive' } : undefined,
          vendorNumber: filters?.vendorNumber ? { equals: filters.vendorNumber } : undefined,
          itemNumber: filters?.itemNumber ? { contains: filters.itemNumber, mode: 'insensitive' } : undefined,
          reportingYear: filters?.year || undefined,
          reportingMonth: filters?.month || undefined,
        },
        orderBy: { uploadedAt: 'desc' },
      });

      if (dbRows.length > 0) {
        return dbRows.map((r) => ({
          company: r.company || '',
          vendorNumber: r.vendorNumber,
          vendorName: r.vendorName,
          buyerNumber: r.buyerNumber,
          buyerName: r.buyerName,
          department: r.department || undefined,
          itemNumber: r.itemNumber,
          itemDescription: r.itemDescription,
          vendorStockNumber: r.vendorStockNumber || '',
          size: r.size || '',
          color: r.color || '',
          sellDown: Number(r.sellDown || 0),
          onHand: r.onHand,
          onOrder: r.onOrder,
          firstCost: Number(r.firstCost || 0),
          preprice: Number(r.preprice || 0),
          retailPrice: Number(r.retailPrice || 0),
          sales2Yr: Number(r.sales2Yr || 0),
          salesLY: Number(r.salesLY || 0),
          sales12M: Number(r.sales12M || 0),
          monthlySalesLY: (r.monthlySalesLY as any) || {},
          monthlySalesCY: (r.monthlySalesCY as any) || {},
          reportingYear: r.reportingYear || undefined,
          reportingMonth: r.reportingMonth || undefined,
          uploadedBy: r.uploadedBy,
          uploadedAt: r.uploadedAt.toISOString(),
        }));
      }
    } catch {
      // fallback to in-memory
    }

    return this.inMemoryRows.filter((r) => {
      if (filters?.department && r.department && !r.department.toLowerCase().includes(filters.department.toLowerCase())) return false;
      if (filters?.buyerName && !r.buyerName.toLowerCase().includes(filters.buyerName.toLowerCase())) return false;
      if (filters?.vendorNumber && !r.vendorNumber.toLowerCase().includes(filters.vendorNumber.toLowerCase())) return false;
      if (filters?.itemNumber && !r.itemNumber.toLowerCase().includes(filters.itemNumber.toLowerCase())) return false;
      if (filters?.year && r.reportingYear !== filters.year) return false;
      if (filters?.month && r.reportingMonth !== filters.month) return false;
      return true;
    });
  }

  public async getBatches(): Promise<IngestionBatchRecord[]> {
    try {
      const batches = await prisma.ingestionBatch.findMany({
        where: { retailerCode: 'HOBBY_LOBBY' },
        orderBy: { uploadedAt: 'desc' },
      });
      if (batches.length > 0) {
        return batches.map((b) => ({
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
    return this.inMemoryBatches;
  }

  public async getMetrics() {
    const data = await this.getData();
    const batches = await this.getBatches();
    const totalSales = data.reduce((acc, r) => acc + (r.sales12M || 0), 0);
    const inventoryUnits = data.reduce((acc, r) => acc + (r.onHand || 0), 0);
    
    return {
      batches: batches.length,
      rows: data.length,
      totalSales,
      inventoryUnits,
    };
  }
}

// Global Singleton instance for Hobby Lobby Microservice
const globalHL = global as unknown as { __hobbyLobbyService?: HobbyLobbyMicroservice };
export const hobbyLobbyService = globalHL.__hobbyLobbyService || new HobbyLobbyMicroservice();
if (process.env.NODE_ENV !== 'production') {
  globalHL.__hobbyLobbyService = hobbyLobbyService;
}
