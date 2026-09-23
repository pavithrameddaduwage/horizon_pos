import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FiveBelowPOS } from '../../database/entities/five-below-pos.entity';
import { IngestionBatch, BatchStatus, RetailerCode } from '../../database/entities/ingestion-batch.entity';
import { parseFiveBelowCSV, FiveBelowFamily } from './five-below.parser';

export interface FiveBelowFilters {
  search?: string;
  family?: string;
  department?: string;
  batchId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class FiveBelowService {
  private readonly logger = new Logger(FiveBelowService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(FiveBelowPOS)
    private readonly fiveBelowRepo: Repository<FiveBelowPOS>,
    @InjectRepository(IngestionBatch)
    private readonly batchRepo: Repository<IngestionBatch>,
  ) {}

  async ingestCsv(
    csvContent: string,
    fileName: string,
    fileSizeBytes: number,
    familyOverride?: FiveBelowFamily,
    uploadedBy: string = 'portal_user',
  ): Promise<{ batchId: string; success: boolean; totalRows: number; validRows: number; errorRows: number }> {
    const parseResult = parseFiveBelowCSV(csvContent, { familyOverride, fileName });

    if (!parseResult.success || parseResult.data.length === 0) {
      throw new Error(`Failed to parse Five Below CSV: ${parseResult.errors.map(e => e.error).join('; ') || 'No valid rows found'}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const uploadedAt = new Date();

    try {
      // 1. Create Ingestion Batch
      const batch = queryRunner.manager.create(IngestionBatch, {
        retailerCode: RetailerCode.FIVE_BELOW,
        fileName,
        fileSizeBytes,
        reportFamily: parseResult.detectedFamily,
        departmentTag: parseResult.detectedDepartments.join(', '),
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        errorRows: parseResult.errorRows,
        status: BatchStatus.PROCESSING,
        errorSummary: parseResult.errors.length > 0 ? parseResult.errors.slice(0, 50) : null,
        uploadedBy,
        uploadedAt,
      });

      const savedBatch = await queryRunner.manager.save(IngestionBatch, batch);

      // 2. Insert rows in chunks
      const chunkSize = 500;
      for (let i = 0; i < parseResult.data.length; i += chunkSize) {
        const chunk = parseResult.data.slice(i, i + chunkSize);
        const entityChunk = chunk.map((row) =>
          queryRunner.manager.create(FiveBelowPOS, {
            batchId: savedBatch.id,
            reportFamily: row.reportFamily,
            reportDate: row.reportDate,
            department: row.department,
            subDepartment: row.subDepartment,
            className: row.className,
            subClassName: row.subClassName,
            vendorNumber: row.vendorNumber,
            vendorName: row.vendorName,
            styleId: row.styleId,
            styleDesc: row.styleDesc,
            sku: row.sku,
            skuDesc: row.skuDesc,
            gtin: row.gtin,
            vendorCasePack: row.vendorCasePack,
            innerCasePack: row.innerCasePack,
            firstReceiptDate: row.firstReceiptDate,
            lastReceiptDate: row.lastReceiptDate,
            currUnitRetailPrice: row.currUnitRetailPrice?.toString(),
            itemCost: row.itemCost?.toString(),
            landedCost: row.landedCost?.toString(),
            salesUWTD: row.salesUWTD,
            salesDWTD: row.salesDWTD?.toString(),
            salesULCW: row.salesULCW,
            salesDLCW: row.salesDLCW?.toString(),
            storeSellThruLCW: row.storeSellThruLCW?.toString(),
            storesWithSalesLCW: row.storesWithSalesLCW,
            storesWithOH: row.storesWithOH,
            salesUL6W: row.salesUL6W,
            salesUYTD: row.salesUYTD,
            salesDYTD: row.salesDYTD?.toString(),
            invOHU: row.invOHU,
            storeOHU: row.storeOHU,
            dcOHU: row.dcOHU,
            dc3OHU: row.dc3OHU,
            dc4OHU: row.dc4OHU,
            dc5OHU: row.dc5OHU,
            dc6OHU: row.dc6OHU,
            dc7OHU: row.dc7OHU,
            totalPackawayOHU: row.totalPackawayOHU,
            wohLCW: row.wohLCW?.toString(),
            storeWohLCW: row.storeWohLCW?.toString(),
            dcWohLCW: row.dcWohLCW?.toString(),
            currOOU: row.currOOU,
            uploadedBy,
            uploadedAt,
          })
        );
        await queryRunner.manager.save(FiveBelowPOS, entityChunk);
      }

      // 3. Complete batch
      savedBatch.status = BatchStatus.COMPLETED;
      await queryRunner.manager.save(IngestionBatch, savedBatch);

      await queryRunner.commitTransaction();
      this.logger.log(`Ingested ${parseResult.validRows} Five Below rows for batch ${savedBatch.id}`);

      return {
        batchId: savedBatch.id,
        success: true,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        errorRows: parseResult.errorRows,
      };
    } catch (err: any) {
      this.logger.error(`Transaction failed for Five Below CSV ingestion: ${err.message}`, err.stack);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getData(filters: FiveBelowFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(500, Math.max(1, filters.limit || 50));
    const skip = (page - 1) * limit;

    const qb = this.fiveBelowRepo.createQueryBuilder('fb');

    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(fb.sku) LIKE :term OR LOWER(fb.skuDesc) LIKE :term OR LOWER(fb.styleDesc) LIKE :term OR LOWER(fb.styleId) LIKE :term OR LOWER(fb.gtin) LIKE :term)',
        { term },
      );
    }

    if (filters.family && filters.family !== 'ALL') {
      qb.andWhere('fb.reportFamily = :family', { family: filters.family });
    }

    if (filters.department) {
      qb.andWhere('fb.department = :dept', { dept: filters.department });
    }

    if (filters.batchId) {
      qb.andWhere('fb.batchId = :batchId', { batchId: filters.batchId });
    }

    qb.orderBy('fb.uploadedAt', 'DESC')
      .addOrderBy('fb.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Summaries
    const statsQb = this.fiveBelowRepo.createQueryBuilder('fb');
    if (filters.batchId) {
      statsQb.andWhere('fb.batchId = :batchId', { batchId: filters.batchId });
    }
    const stats = await statsQb
      .select('SUM(fb.invOHU)', 'totalInvOHU')
      .addSelect('SUM(fb.salesUWTD)', 'totalSalesUWTD')
      .addSelect('SUM(CAST(fb.salesDWTD AS decimal))', 'totalSalesDWTD')
      .addSelect('SUM(CAST(fb.salesDYTD AS decimal))', 'totalSalesDYTD')
      .getRawOne();

    const families = await this.fiveBelowRepo
      .createQueryBuilder('fb')
      .select('DISTINCT fb.reportFamily', 'reportFamily')
      .where('fb.reportFamily IS NOT NULL')
      .getRawMany();

    const depts = await this.fiveBelowRepo
      .createQueryBuilder('fb')
      .select('DISTINCT fb.department', 'department')
      .where('fb.department IS NOT NULL')
      .getRawMany();

    return {
      success: true,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalInvOHU: parseInt(stats?.totalInvOHU || '0', 10),
        totalSalesUWTD: parseInt(stats?.totalSalesUWTD || '0', 10),
        totalSalesDWTD: parseFloat(stats?.totalSalesDWTD || '0'),
        totalSalesDYTD: parseFloat(stats?.totalSalesDYTD || '0'),
      },
      families: families.map((f) => f.reportFamily).filter(Boolean),
      departments: depts.map((d) => d.department).filter(Boolean),
    };
  }
}
