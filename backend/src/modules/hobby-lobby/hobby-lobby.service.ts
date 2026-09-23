import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { HobbyLobbyPOS } from '../../database/entities/hobby-lobby-pos.entity';
import { IngestionBatch, BatchStatus, RetailerCode } from '../../database/entities/ingestion-batch.entity';
import { parseHobbyLobbyCSV, HobbyLobbyParseResult } from './hobby-lobby.parser';

export interface HobbyLobbyFilters {
  search?: string;
  department?: string;
  vendorNumber?: string;
  reportingYear?: number;
  reportingMonth?: number;
  batchId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class HobbyLobbyService {
  private readonly logger = new Logger(HobbyLobbyService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(HobbyLobbyPOS)
    private readonly hobbyLobbyRepo: Repository<HobbyLobbyPOS>,
    @InjectRepository(IngestionBatch)
    private readonly batchRepo: Repository<IngestionBatch>,
  ) {}

  async ingestCsv(
    csvContent: string,
    fileName: string,
    fileSizeBytes: number,
    uploadedBy: string = 'portal_user',
    departmentOverride?: string,
    vendorOverride?: string,
    yearOverride?: number,
    monthOverride?: number,
  ): Promise<{
    batchId: string;
    retailerCode: RetailerCode;
    vendorNumber?: string;
    departmentTag?: string;
    reportingYear?: number;
    reportingMonth?: number;
    success: boolean;
    totalRows: number;
    validRows: number;
    errorRows: number;
    isDuplicateReplacement?: boolean;
  }> {
    const parseResult: HobbyLobbyParseResult = parseHobbyLobbyCSV(csvContent, {
      fileName,
      departmentOverride,
      vendorOverride,
      yearOverride,
      monthOverride,
    });

    if (!parseResult.success || parseResult.data.length === 0) {
      throw new Error(`Failed to parse Hobby Lobby CSV: ${parseResult.errors.map(e => e.error).join('; ') || 'No valid rows found'}`);
    }

    const fileHash = createHash('sha256').update(csvContent).digest('hex');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const uploadedAt = new Date();
    const finalDepartmentTag = departmentOverride || parseResult.detectedDepartments.join(', ') || 'General';
    const finalVendorNumber = vendorOverride || parseResult.detectedVendors[0] || '15371';
    const finalYear = parseResult.detectedYear || new Date().getFullYear();
    const finalMonth = parseResult.detectedMonth || new Date().getMonth() + 1;
    let isDuplicateReplacement = false;

    try {
      // 1. Check for existing duplicate batch (same file hash OR same period/vendor/file)
      const existingBatch = await queryRunner.manager.findOne(IngestionBatch, {
        where: [
          { fileHash },
          {
            retailerCode: RetailerCode.HOBBY_LOBBY,
            vendorNumberTag: finalVendorNumber,
            reportingYear: finalYear,
            reportingMonth: finalMonth,
            fileName,
          },
        ],
      });

      if (existingBatch) {
        isDuplicateReplacement = true;
        this.logger.log(
          `Detected duplicate/replacement ingestion batch ${existingBatch.id} for Vendor ${finalVendorNumber} (${finalMonth}/${finalYear}). Replacing prior records to prevent duplication.`
        );
        await queryRunner.manager.delete(IngestionBatch, { id: existingBatch.id });
      }

      // 2. Create Ingestion Batch
      const batch = queryRunner.manager.create(IngestionBatch, {
        retailerCode: RetailerCode.HOBBY_LOBBY,
        fileName,
        fileSizeBytes,
        fileHash,
        departmentTag: finalDepartmentTag,
        vendorNumberTag: finalVendorNumber,
        reportingYear: finalYear,
        reportingMonth: finalMonth,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        errorRows: parseResult.errorRows,
        status: BatchStatus.PROCESSING,
        errorSummary: parseResult.errors.length > 0 ? parseResult.errors.slice(0, 50) : null,
        uploadedBy,
        uploadedAt,
      });

      const savedBatch = await queryRunner.manager.save(IngestionBatch, batch);

      // 2. Insert rows in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < parseResult.data.length; i += chunkSize) {
        const chunk = parseResult.data.slice(i, i + chunkSize);
        const entityChunk = chunk.map((row) =>
          queryRunner.manager.create(HobbyLobbyPOS, {
            batchId: savedBatch.id,
            company: row.company,
            vendorNumber: row.vendorNumber,
            vendorName: row.vendorName,
            buyerNumber: row.buyerNumber,
            buyerName: row.buyerName,
            department: row.department,
            itemNumber: row.itemNumber,
            itemDescription: row.itemDescription,
            vendorStockNumber: row.vendorStockNumber,
            size: row.size,
            color: row.color,
            sellDown: row.sellDown?.toString(),
            onHand: row.onHand,
            onOrder: row.onOrder,
            firstCost: row.firstCost?.toString(),
            preprice: row.preprice?.toString(),
            retailPrice: row.retailPrice?.toString(),
            sales2Yr: row.sales2Yr?.toString(),
            salesLY: row.salesLY?.toString(),
            sales12M: row.sales12M?.toString(),
            // 12 LY Month columns
            lyJanSales: row.lyJanSales?.toString(),
            lyFebSales: row.lyFebSales?.toString(),
            lyMarSales: row.lyMarSales?.toString(),
            lyAprSales: row.lyAprSales?.toString(),
            lyMaySales: row.lyMaySales?.toString(),
            lyJunSales: row.lyJunSales?.toString(),
            lyJulSales: row.lyJulSales?.toString(),
            lyAugSales: row.lyAugSales?.toString(),
            lySepSales: row.lySepSales?.toString(),
            lyOctSales: row.lyOctSales?.toString(),
            lyNovSales: row.lyNovSales?.toString(),
            lyDecSales: row.lyDecSales?.toString(),
            // 12 CY Month columns
            cyJanSales: row.cyJanSales?.toString(),
            cyFebSales: row.cyFebSales?.toString(),
            cyMarSales: row.cyMarSales?.toString(),
            cyAprSales: row.cyAprSales?.toString(),
            cyMaySales: row.cyMaySales?.toString(),
            cyJunSales: row.cyJunSales?.toString(),
            cyJulSales: row.cyJulSales?.toString(),
            cyAugSales: row.cyAugSales?.toString(),
            cySepSales: row.cySepSales?.toString(),
            cyOctSales: row.cyOctSales?.toString(),
            cyNovSales: row.cyNovSales?.toString(),
            cyDecSales: row.cyDecSales?.toString(),
            reportingYear: row.reportingYear,
            reportingMonth: row.reportingMonth,
            uploadedBy,
            uploadedAt,
          })
        );
        await queryRunner.manager.save(HobbyLobbyPOS, entityChunk);
      }

      // 3. Mark batch completed
      savedBatch.status = BatchStatus.COMPLETED;
      await queryRunner.manager.save(IngestionBatch, savedBatch);

      await queryRunner.commitTransaction();
      this.logger.log(`Ingested ${parseResult.validRows} Hobby Lobby rows for batch ${savedBatch.id} (Department: ${finalDepartmentTag})`);

      return {
        batchId: savedBatch.id,
        retailerCode: RetailerCode.HOBBY_LOBBY,
        vendorNumber: finalVendorNumber,
        departmentTag: finalDepartmentTag,
        reportingYear: finalYear,
        reportingMonth: finalMonth,
        success: true,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        errorRows: parseResult.errorRows,
        isDuplicateReplacement,
      };
    } catch (err: any) {
      this.logger.error(`Transaction failed for Hobby Lobby CSV ingestion: ${err.message}`, err.stack);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getData(filters: HobbyLobbyFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(500, Math.max(1, filters.limit || 50));
    const skip = (page - 1) * limit;

    const qb = this.hobbyLobbyRepo.createQueryBuilder('hl');

    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(hl.itemNumber) LIKE :term OR LOWER(hl.itemDescription) LIKE :term OR LOWER(hl.vendorStockNumber) LIKE :term OR LOWER(hl.vendorNumber) LIKE :term)',
        { term },
      );
    }

    if (filters.department) {
      qb.andWhere('hl.department = :dept', { dept: filters.department });
    }

    if (filters.vendorNumber) {
      qb.andWhere('hl.vendorNumber = :vendor', { vendor: filters.vendorNumber });
    }

    if (filters.reportingYear) {
      qb.andWhere('hl.reportingYear = :year', { year: filters.reportingYear });
    }

    if (filters.reportingMonth) {
      qb.andWhere('hl.reportingMonth = :month', { month: filters.reportingMonth });
    }

    if (filters.batchId) {
      qb.andWhere('hl.batchId = :batchId', { batchId: filters.batchId });
    }

    qb.orderBy('hl.uploadedAt', 'DESC')
      .addOrderBy('hl.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Calculate aggregated stats
    const statsQb = this.hobbyLobbyRepo.createQueryBuilder('hl');
    if (filters.batchId) {
      statsQb.andWhere('hl.batchId = :batchId', { batchId: filters.batchId });
    }
    const stats = await statsQb
      .select('SUM(hl.onHand)', 'totalOnHand')
      .addSelect('SUM(hl.onOrder)', 'totalOnOrder')
      .addSelect('SUM(CAST(hl.sales12M AS decimal))', 'totalSales12M')
      .getRawOne();

    // Unique departments for dropdown
    const depts = await this.hobbyLobbyRepo
      .createQueryBuilder('hl')
      .select('DISTINCT hl.department', 'department')
      .where('hl.department IS NOT NULL')
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
        totalOnHand: parseInt(stats?.totalOnHand || '0', 10),
        totalOnOrder: parseInt(stats?.totalOnOrder || '0', 10),
        totalSales12M: parseFloat(stats?.totalSales12M || '0'),
      },
      departments: depts.map((d) => d.department).filter(Boolean),
    };
  }
}
