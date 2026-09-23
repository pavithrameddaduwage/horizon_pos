import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MsiPOS } from '../../database/entities/msi-pos.entity';
import { IngestionBatch, BatchStatus, RetailerCode } from '../../database/entities/ingestion-batch.entity';
import { parseMsiCSV } from './msi.parser';

export interface MsiFilters {
  search?: string;
  department?: string;
  storeId?: string;
  batchId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class MsiService {
  private readonly logger = new Logger(MsiService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(MsiPOS)
    private readonly msiRepo: Repository<MsiPOS>,
    @InjectRepository(IngestionBatch)
    private readonly batchRepo: Repository<IngestionBatch>,
  ) {}

  async ingestCsv(
    csvContent: string,
    fileName: string,
    fileSizeBytes: number,
    uploadedBy: string = 'portal_user',
  ): Promise<{ batchId: string; success: boolean; totalRows: number; validRows: number; errorRows: number }> {
    const parseResult = parseMsiCSV(csvContent);

    if (!parseResult.success || parseResult.data.length === 0) {
      throw new Error(`Failed to parse MSI CSV: ${parseResult.errors.map(e => e.error).join('; ') || 'No valid rows found'}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const uploadedAt = new Date();

    try {
      // 1. Create Ingestion Batch
      const batch = queryRunner.manager.create(IngestionBatch, {
        retailerCode: RetailerCode.MSI,
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
          queryRunner.manager.create(MsiPOS, {
            batchId: savedBatch.id,
            storeId: row.storeId,
            registerId: row.registerId,
            cashierId: row.cashierId,
            shiftId: row.shiftId,
            receiptNumber: row.receiptNumber,
            lineNumber: row.lineNumber,
            sku: row.sku,
            description: row.description,
            department: row.department,
            quantity: row.quantity,
            unitPrice: row.unitPrice.toString(),
            discountAmount: row.discountAmount.toString(),
            taxAmount: row.taxAmount.toString(),
            totalAmount: row.totalAmount.toString(),
            tenderType: row.tenderType,
            transactionTime: row.transactionTime ? new Date(row.transactionTime) : new Date(),
            uploadedBy,
            uploadedAt,
          })
        );
        await queryRunner.manager.save(MsiPOS, entityChunk);
      }

      // 3. Mark batch completed
      savedBatch.status = BatchStatus.COMPLETED;
      await queryRunner.manager.save(IngestionBatch, savedBatch);

      await queryRunner.commitTransaction();
      this.logger.log(`Ingested ${parseResult.validRows} MSI rows for batch ${savedBatch.id}`);

      return {
        batchId: savedBatch.id,
        success: true,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        errorRows: parseResult.errorRows,
      };
    } catch (err: any) {
      this.logger.error(`Transaction failed for MSI CSV ingestion: ${err.message}`, err.stack);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getData(filters: MsiFilters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(500, Math.max(1, filters.limit || 50));
    const skip = (page - 1) * limit;

    const qb = this.msiRepo.createQueryBuilder('m');

    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(m.sku) LIKE :term OR LOWER(m.description) LIKE :term OR LOWER(m.receiptNumber) LIKE :term)',
        { term },
      );
    }

    if (filters.department) {
      qb.andWhere('m.department = :dept', { dept: filters.department });
    }

    if (filters.storeId) {
      qb.andWhere('m.storeId = :store', { store: filters.storeId });
    }

    if (filters.batchId) {
      qb.andWhere('m.batchId = :batchId', { batchId: filters.batchId });
    }

    qb.orderBy('m.uploadedAt', 'DESC')
      .addOrderBy('m.createdAt', 'DESC')
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
