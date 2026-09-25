import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IngestionBatch } from './ingestion-batch.entity';

@Entity('hobby_lobby_pos')
@Index(['batchId'])

@Index(['vendorNumber'])
@Index(['buyerNumber'])
@Index(['itemNumber'])
@Index(['reportingYear', 'reportingMonth'])
@Index(['vendorNumber', 'itemNumber', 'reportingYear', 'reportingMonth'], { unique: true })
@Index(['uploadedAt'])
export class HobbyLobbyPOS {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'batch_id' })
  batchId: string;

  @ManyToOne(() => IngestionBatch, (batch: IngestionBatch) => batch.hobbyLobbyRows, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batch_id' })
  batch: IngestionBatch;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'company' })
  company?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'vendor_number' })
  vendorNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'vendor_name' })
  vendorName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'buyer_number' })
  buyerNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'buyer_name' })
  buyerName?: string;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'department' })
  department?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'item_number' })
  itemNumber?: string;

  @Column({ type: 'text', nullable: true, name: 'item_description' })
  itemDescription?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'vendor_stock_number' })
  vendorStockNumber?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'size' })
  size?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'color' })
  color?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'sell_down' })
  sellDown?: string | null;

  @Column({ type: 'int', default: 0, name: 'on_hand' })
  onHand: number;

  @Column({ type: 'int', default: 0, name: 'on_order' })
  onOrder: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'first_cost' })
  firstCost?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'preprice' })
  preprice?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'retail_price' })
  retailPrice?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'sales_2yr' })
  sales2Yr?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'sales_ly' })
  salesLY?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'sales_12m' })
  sales12M?: string | null;

  // 12 Last Year (LY) Monthly Sales Columns
  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_jan_sales' })
  lyJanSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_feb_sales' })
  lyFebSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_mar_sales' })
  lyMarSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_apr_sales' })
  lyAprSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_may_sales' })
  lyMaySales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_jun_sales' })
  lyJunSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_jul_sales' })
  lyJulSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_aug_sales' })
  lyAugSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_sep_sales' })
  lySepSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_oct_sales' })
  lyOctSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_nov_sales' })
  lyNovSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'ly_dec_sales' })
  lyDecSales?: string | null;

  // 12 Current Year (CY) Monthly Sales Columns
  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_jan_sales' })
  cyJanSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_feb_sales' })
  cyFebSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_mar_sales' })
  cyMarSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_apr_sales' })
  cyAprSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_may_sales' })
  cyMaySales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_jun_sales' })
  cyJunSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_jul_sales' })
  cyJulSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_aug_sales' })
  cyAugSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_sep_sales' })
  cySepSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_oct_sales' })
  cyOctSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_nov_sales' })
  cyNovSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'cy_dec_sales' })
  cyDecSales?: string | null;

  @Column({ type: 'int', nullable: true, name: 'reporting_year' })
  reportingYear?: number | null;

  @Column({ type: 'int', nullable: true, name: 'reporting_month' })
  reportingMonth?: number | null;

  @Column({ type: 'varchar', length: 100, default: 'portal_user', name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', name: 'uploaded_at' })
  uploadedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;
}
