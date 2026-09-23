import { Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IngestionBatch, BatchStatus } from '../../database/entities/ingestion-batch.entity';
import { HobbyLobbyPOS } from '../../database/entities/hobby-lobby-pos.entity';
import { FiveBelowPOS } from '../../database/entities/five-below-pos.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(IngestionBatch)
    private readonly batchRepo: Repository<IngestionBatch>,
    @InjectRepository(HobbyLobbyPOS)
    private readonly hobbyLobbyRepo: Repository<HobbyLobbyPOS>,
    @InjectRepository(FiveBelowPOS)
    private readonly fiveBelowRepo: Repository<FiveBelowPOS>,
    private readonly dataSource: DataSource,
  ) {}

  async getBatches(limit: number = 50, page: number = 1) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.batchRepo.findAndCount({
      order: { uploadedAt: 'DESC' },
      skip,
      take: limit,
    });

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

  async getBatchById(id: string) {
    const batch = await this.batchRepo.findOne({ where: { id } });
    if (!batch) {
      return { success: false, message: 'Batch not found' };
    }
    return { success: true, batch };
  }

  async getSummaryStats() {
    try {
      const totalBatches = await this.batchRepo.count();

      const batchSum = await this.batchRepo
        .createQueryBuilder('b')
        .select('SUM(b.totalRows)', 'totalRows')
        .addSelect('SUM(b.validRows)', 'validRows')
        .where('b.status = :status', { status: BatchStatus.COMPLETED })
        .getRawOne();

      const hlStats = await this.hobbyLobbyRepo
        .createQueryBuilder('hl')
        .select('SUM(hl.onHand)', 'totalOnHand')
        .addSelect('SUM(CAST(hl.sales12M AS decimal))', 'totalSales12M')
        .getRawOne();

      const fbStats = await this.fiveBelowRepo
        .createQueryBuilder('fb')
        .select('SUM(fb.invOHU)', 'totalInvOHU')
        .addSelect('SUM(CAST(fb.salesDYTD AS decimal))', 'totalSalesDYTD')
        .getRawOne();

      const totalOnHandUnits =
        (parseInt(hlStats?.totalOnHand || '0', 10)) +
        (parseInt(fbStats?.totalInvOHU || '0', 10));

      const totalSalesRevenue =
        (parseFloat(hlStats?.totalSales12M || '0')) +
        (parseFloat(fbStats?.totalSalesDYTD || '0'));

      return {
        success: true,
        summary: {
          totalBatches,
          totalProcessedRows: parseInt(batchSum?.validRows || '0', 10),
          totalRetailers: 4,
          totalOnHandUnits,
          totalSalesRevenue,
        },
      };
    } catch (err: any) {
      this.logger.error(`Error calculating summary stats: ${err.message}`, err.stack);
      return {
        success: true,
        summary: {
          totalBatches: 0,
          totalProcessedRows: 0,
          totalRetailers: 4,
          totalOnHandUnits: 0,
          totalSalesRevenue: 0,
        },
      };
    }
  }
}
