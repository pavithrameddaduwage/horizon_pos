import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { KohlsPOS } from '../../database/entities/kohls-pos.entity';
import { IngestionBatch, BatchStatus, RetailerCode } from '../../database/entities/ingestion-batch.entity';
import { parseKohlsCSV } from './kohls.parser';

export interface KohlsFilters {
  search?: string;
  department?: string;
  storeNumber?: string;
  batchId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class KohlsService {
  private readonly logger = new Logger(KohlsService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(KohlsPOS)
    private readonly kohlsRepo: Repository<KohlsPOS>,
    @InjectRepository(IngestionBatch)
    private readonly batchRepo: Repository<IngestionBatch>,
  ) {}

  async ingestCsv(
    csvContent: string,
    fileName: string,
    fileSizeBytes: number,
    uploadedBy: string = 'portal_user',
  ): Promise<{ batchId: string; success: boolean; totalRows: number; validRows: number; errorRows: number }> {
    const parseResult = parseKohlsCSV(csvContent);

    if (!parseResult.success || parseResult.data.length === 0) {
      throw new Error(`Failed to parse Kohl's CSV: ${parseResult.errors.map(e => e.error).join('; ') || 'No valid rows found'}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const uploadedAt = new Date();

    try {
      // 1. Create Ingestion Batch
      const batch = queryRunner.manager.create(IngestionBatch, {
        retailerCode: RetailerCode.KOHLS,
        fileName,
        fileSizeBytes,
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
          queryRunner.manager.create(KohlsPOS, {
            batchId: savedBatch.id,
            storeNumber: row.storeNumber,
            storeName: row.storeName,
            vendorNumber: row.vendorNumber,
            sku: row.sku,
            upc: row.upc,
            styleNumber: row.styleNumber,
            colorCode: row.colorCode,
            sizeCode: row.sizeCode,
            department: row.department,
            className: row.className,
            subclass: row.subclass,
            posUnits: row.posUnits,
            posDollars: row.posDollars.toString(),
            regularUnits: row.regularUnits,
            regularDollars: row.regularDollars.toString(),
            markdownUnits: row.markdownUnits,
            markdownDollars: row.markdownDollars.toString(),
            returnUnits: row.returnUnits,
            returnDollars: row.returnDollars.toString(),
            storeOHUnits: row.storeOHUnits,
            onOrderUnits: row.onOrderUnits,
            inTransitUnits: row.inTransitUnits,
            weekEndDate: row.weekEndDate ? new Date(row.weekEndDate) : null,
            uploadedBy,
            uploadedAt,
          })
        );
        await queryRunner.manager.save(KohlsPOS, entityChunk);
      }

      // 3. Mark batch completed
      savedBatch.status = BatchStatus.COMPLETED;
      await queryRunner.manager.save(IngestionBatch, savedBatch);

      await queryRunner.commitTransaction();
      this.logger.log(`Ingested ${parseResult.validRows} Kohl's rows for batch ${savedBatch.id}`);

      return {
        batchId: savedBatch.id,
        success: true,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        errorRows: parseResult.errorRows,
      };
    } catch (err: any) {
      this.logger.error(`Transaction failed for Kohl's CSV ingestion: ${err.message}`, err.stack);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getData(filters: KohlsFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(500, Math.max(1, filters.limit || 50));
    const skip = (page - 1) * limit;

    const qb = this.kohlsRepo.createQueryBuilder('k');

    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(k.sku) LIKE :term OR LOWER(k.upc) LIKE :term OR LOWER(k.styleNumber) LIKE :term OR LOWER(k.storeName) LIKE :term)',
        { term },
      );
    }

    if (filters.department) {
      qb.andWhere('k.department = :dept', { dept: filters.department });
    }

    if (filters.storeNumber) {
      qb.andWhere('k.storeNumber = :store', { store: filters.storeNumber });
    }

    if (filters.batchId) {
      qb.andWhere('k.batchId = :batchId', { batchId: filters.batchId });
    }

    qb.orderBy('k.uploadedAt', 'DESC')
      .addOrderBy('k.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      success: true,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
