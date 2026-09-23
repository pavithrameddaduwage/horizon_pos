// Microservice 2: Five Below POS Service
// Decoupled backend component for Five Below Multi-Family POS Ingestion, Sell-Through, and Analytics.
// Persists directly to PostgreSQL database with Upserts and Deduplication.

import { FiveBelowRow, FiveBelowFamily, IngestionBatchRecord, ParseResult } from '@/lib/types/pos';
import { parseFiveBelowCSV } from '@/lib/parsers/five-below-parser';
import { prisma } from '@/lib/prisma';
import { verifyAndInitDatabase } from '@/lib/db-init';

export interface FiveBelowFilterParams {
  reportFamily?: string;
  department?: string;
  sku?: string;
}

export class FiveBelowMicroservice {
  private serviceUrl: string | undefined;
  private inMemoryRows: Array<FiveBelowRow & { id: string; batchId: string; uploadedBy: string; uploadedAt: string; createdAt: string }> = [];
  private inMemoryBatches: IngestionBatchRecord[] = [];

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
    await verifyAndInitDatabase();

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
        console.warn(`[FiveBelowMicroservice] Remote service error, using local DB:`, err);
      }
    }

    const { fileContent, fileName, familyOverride, departmentOverride, uploadedBy = 'portal_user' } = params;
    const batchId = `fb_batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();

    const parseResult = parseFiveBelowCSV(fileContent, { familyOverride, fileName });

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
      uploadedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // 1. Try to persist into PostgreSQL via Prisma
    try {
      await prisma.ingestionBatch.create({
        data: {
          id: batchId,
          retailerCode: 'FIVE_BELOW',
          fileName,
          fileSizeBytes: batchRecord.fileSizeBytes,
          reportFamily: batchRecord.reportFamily,
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
          id: `fb_${batchId}_${idx}`,
          batchId,
          reportFamily: r.reportFamily,
          reportDate: r.reportDate || null,
          department: r.department || null,
          subDepartment: r.subDepartment || null,
          className: r.className || null,
          subClassName: r.subClassName || null,
          vendorNumber: r.vendorNumber || null,
          vendorName: r.vendorName || null,
          styleId: r.styleId || null,
          styleDesc: r.styleDesc || null,
          sku: r.sku,
          skuDesc: r.skuDesc || null,
          gtin: r.gtin || null,
          vendorCasePack: r.vendorCasePack || null,
          innerCasePack: r.innerCasePack || null,
          firstReceiptDate: r.firstReceiptDate || null,
          lastReceiptDate: r.lastReceiptDate || null,
          currUnitRetailPrice: r.currUnitRetailPrice,
          itemCost: r.itemCost,
          landedCost: r.landedCost,
          salesUWTD: r.salesUWTD,
          salesDWTD: r.salesDWTD,
          salesULCW: r.salesULCW,
          salesDLCW: r.salesDLCW,
          storeSellThruLCW: r.storeSellThruLCW,
          storesWithSalesLCW: r.storesWithSalesLCW,
          storesWithOH: r.storesWithOH,
          salesUL6W: r.salesUL6W,
          salesUYTD: r.salesUYTD,
          salesDYTD: r.salesDYTD,
          invOHU: r.invOHU,
          storeOHU: r.storeOHU,
          dcOHU: r.dcOHU,
          dc3OHU: r.dc3OHU,
          dc4OHU: r.dc4OHU,
          dc5OHU: r.dc5OHU,
          dc6OHU: r.dc6OHU,
          dc7OHU: r.dc7OHU,
          totalPackawayOHU: r.totalPackawayOHU,
          wohLCW: r.wohLCW,
          storeWohLCW: r.storeWohLCW,
          dcWohLCW: r.dcWohLCW,
          currOOU: r.currOOU,
          uploadedBy,
          uploadedAt: now,
        }));

        await prisma.fiveBelowPOS.createMany({
          data: rowsToInsert,
          skipDuplicates: true,
        });
      }
    } catch (dbErr: any) {
      console.warn('[FiveBelowMicroservice] DB insert fallback to memory:', dbErr?.message || dbErr);
    }

    // 2. Keep in-memory cache synchronized
    if (parseResult.success) {
      parseResult.data.forEach((parsedRow, idx) => {
        const rowKey = `${parsedRow.reportFamily}_${parsedRow.sku || parsedRow.gtin || parsedRow.styleId}_${parsedRow.reportDate || ''}`;
        const existingIdx = this.inMemoryRows.findIndex((r) => {
          const k = `${r.reportFamily}_${r.sku || r.gtin || r.styleId}_${r.reportDate || ''}`;
          return k === rowKey;
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
            id: `fb_${batchId}_${idx}`,
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

  public async getData(filters?: FiveBelowFilterParams): Promise<Array<FiveBelowRow & { uploadedBy: string; uploadedAt: string }>> {
    await verifyAndInitDatabase();

    try {
      const dbRows = await prisma.fiveBelowPOS.findMany({
        where: {
          reportFamily: filters?.reportFamily && filters.reportFamily !== 'ALL' ? { equals: filters.reportFamily } : undefined,
          department: filters?.department ? { contains: filters.department, mode: 'insensitive' } : undefined,
          sku: filters?.sku ? { contains: filters.sku, mode: 'insensitive' } : undefined,
        },
        orderBy: { uploadedAt: 'desc' },
      });

      if (dbRows.length > 0) {
        return dbRows.map((r) => ({
          reportFamily: r.reportFamily as any,
          reportDate: r.reportDate || undefined,
          department: r.department || '',
          subDepartment: r.subDepartment || '',
          className: r.className || '',
          subClassName: r.subClassName || '',
          vendorNumber: r.vendorNumber || undefined,
          vendorName: r.vendorName || undefined,
          styleId: r.styleId || '',
          styleDesc: r.styleDesc || '',
          sku: r.sku || undefined,
          skuDesc: r.skuDesc || '',
          gtin: r.gtin || '',
          vendorCasePack: r.vendorCasePack || 0,
          innerCasePack: r.innerCasePack || 0,
          firstReceiptDate: r.firstReceiptDate || undefined,
          lastReceiptDate: r.lastReceiptDate || undefined,
          currUnitRetailPrice: Number(r.currUnitRetailPrice || 0),
          itemCost: Number(r.itemCost || 0),
          landedCost: Number(r.landedCost || 0),
          salesUWTD: r.salesUWTD || 0,
          salesDWTD: Number(r.salesDWTD || 0),
          salesULCW: r.salesULCW || 0,
          salesDLCW: Number(r.salesDLCW || 0),
          storeSellThruLCW: Number(r.storeSellThruLCW || 0),
          storesWithSalesLCW: r.storesWithSalesLCW || 0,
          storesWithOH: r.storesWithOH || 0,
          salesUL6W: r.salesUL6W || 0,
          salesUYTD: r.salesUYTD || 0,
          salesDYTD: Number(r.salesDYTD || 0),
          invOHU: r.invOHU || 0,
          storeOHU: r.storeOHU || 0,
          dcOHU: r.dcOHU || 0,
          dc3OHU: r.dc3OHU || 0,
          dc4OHU: r.dc4OHU || 0,
          dc5OHU: r.dc5OHU || 0,
          dc6OHU: r.dc6OHU || 0,
          dc7OHU: r.dc7OHU || 0,
          totalPackawayOHU: r.totalPackawayOHU || 0,
          wohLCW: Number(r.wohLCW || 0),
          storeWohLCW: Number(r.storeWohLCW || 0),
          dcWohLCW: Number(r.dcWohLCW || 0),
          currOOU: r.currOOU || 0,
          uploadedBy: r.uploadedBy,
          uploadedAt: r.uploadedAt.toISOString(),
        }));
      }
    } catch {
      // fallback
    }

    return this.inMemoryRows.filter((r) => {
      if (filters?.reportFamily && filters.reportFamily !== 'ALL' && r.reportFamily !== filters.reportFamily) return false;
      if (filters?.department && r.department && !r.department.toLowerCase().includes(filters.department.toLowerCase())) return false;
      if (filters?.sku && r.sku && !r.sku.toLowerCase().includes(filters.sku.toLowerCase())) return false;
      return true;
    });
  }

  public async getBatches(): Promise<IngestionBatchRecord[]> {
    try {
      const batches = await prisma.ingestionBatch.findMany({
        where: { retailerCode: 'FIVE_BELOW' },
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
    const totalSales = data.reduce((acc, r) => acc + (r.salesDYTD || 0), 0);
    const inventoryUnits = data.reduce((acc, r) => acc + (r.invOHU || 0), 0);
    return {
      batches: batches.length,
      rows: data.length,
      totalSales,
      inventoryUnits,
    };
  }
}

const globalFB = global as unknown as { __fiveBelowService?: FiveBelowMicroservice };
export const fiveBelowService = globalFB.__fiveBelowService || new FiveBelowMicroservice();
if (process.env.NODE_ENV !== 'production') {
  globalFB.__fiveBelowService = fiveBelowService;
}
