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

      // 2. In-memory deduplicate rows by composite key: (vendorNumber + itemNumber + reportingYear + reportingMonth)
      const uniqueRowsMap = new Map<string, typeof parseResult.data[0]>();
      for (const row of parseResult.data) {
        const rowVendor = row.vendorNumber || finalVendorNumber;
        const rowYear = row.reportingYear || finalYear;
        const rowMonth = row.reportingMonth || finalMonth;
        const compositeKey = `${rowVendor}_${row.itemNumber}_${rowYear}_${rowMonth}`.toLowerCase();
        uniqueRowsMap.set(compositeKey, row);
      }
      const deduplicatedRows = Array.from(uniqueRowsMap.values());

      // 3. Upsert rows in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < deduplicatedRows.length; i += chunkSize) {
        const chunk = deduplicatedRows.slice(i, i + chunkSize);
        const entityChunk = chunk.map((row) => ({
          batchId: savedBatch.id,
          company: row.company || null,
          vendorNumber: row.vendorNumber || finalVendorNumber,
          vendorName: row.vendorName || null,
          buyerNumber: row.buyerNumber || null,
          buyerName: row.buyerName || null,
          department: row.department || finalDepartmentTag,
          itemNumber: row.itemNumber,
          itemDescription: row.itemDescription || null,
          vendorStockNumber: row.vendorStockNumber || null,
          size: row.size || null,
          color: row.color || null,
          sellDown: row.sellDown?.toString() || null,
          onHand: row.onHand || 0,
          onOrder: row.onOrder || 0,
          firstCost: row.firstCost?.toString() || null,
          preprice: row.preprice?.toString() || null,
          retailPrice: row.retailPrice?.toString() || null,
          sales2Yr: row.sales2Yr?.toString() || null,
          salesLY: row.salesLY?.toString() || null,
          sales12M: row.sales12M?.toString() || null,
          // 12 LY Month columns
          lyJanSales: row.lyJanSales?.toString() || null,
          lyFebSales: row.lyFebSales?.toString() || null,
          lyMarSales: row.lyMarSales?.toString() || null,
          lyAprSales: row.lyAprSales?.toString() || null,
          lyMaySales: row.lyMaySales?.toString() || null,
          lyJunSales: row.lyJunSales?.toString() || null,
          lyJulSales: row.lyJulSales?.toString() || null,
          lyAugSales: row.lyAugSales?.toString() || null,
          lySepSales: row.lySepSales?.toString() || null,
          lyOctSales: row.lyOctSales?.toString() || null,
          lyNovSales: row.lyNovSales?.toString() || null,
          lyDecSales: row.lyDecSales?.toString() || null,
          // 12 CY Month columns
          cyJanSales: row.cyJanSales?.toString() || null,
          cyFebSales: row.cyFebSales?.toString() || null,
          cyMarSales: row.cyMarSales?.toString() || null,
          cyAprSales: row.cyAprSales?.toString() || null,
          cyMaySales: row.cyMaySales?.toString() || null,
          cyJunSales: row.cyJunSales?.toString() || null,
          cyJulSales: row.cyJulSales?.toString() || null,
          cyAugSales: row.cyAugSales?.toString() || null,
          cySepSales: row.cySepSales?.toString() || null,
          cyOctSales: row.cyOctSales?.toString() || null,
          cyNovSales: row.cyNovSales?.toString() || null,
          cyDecSales: row.cyDecSales?.toString() || null,
          reportingYear: row.reportingYear || finalYear,
          reportingMonth: row.reportingMonth || finalMonth,
          uploadedBy,
          uploadedAt,
        }));

        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(HobbyLobbyPOS)
          .values(entityChunk)
          .orUpdate(
            [
              'company',
              'vendor_name',
              'buyer_number',
              'buyer_name',
              'department',
              'item_description',
              'vendor_stock_number',
              'size',
              'color',
              'sell_down',
              'on_hand',
              'on_order',
              'first_cost',
              'preprice',
              'retail_price',
              'sales_2yr',
              'sales_ly',
              'sales_12m',
              'ly_jan_sales',
              'ly_feb_sales',
              'ly_mar_sales',
              'ly_apr_sales',
              'ly_may_sales',
              'ly_jun_sales',
              'ly_jul_sales',
              'ly_aug_sales',
              'ly_sep_sales',
              'ly_oct_sales',
              'ly_nov_sales',
              'ly_dec_sales',
              'cy_jan_sales',
              'cy_feb_sales',
              'cy_mar_sales',
              'cy_apr_sales',
              'cy_may_sales',
              'cy_jun_sales',
              'cy_jul_sales',
              'cy_aug_sales',
              'cy_sep_sales',
              'cy_oct_sales',
              'cy_nov_sales',
              'cy_dec_sales',
              'batch_id',
              'uploaded_by',
              'uploaded_at',
            ],
            ['vendor_number', 'item_number', 'reporting_year', 'reporting_month'],
          )
          .execute();
      }

      // 4. Mark batch completed
      savedBatch.validRows = deduplicatedRows.length;
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
