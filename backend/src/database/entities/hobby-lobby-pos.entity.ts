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

@Entity('HobbyLobbyPOS')
@Index(['batchId'])
@Index(['vendorNumber'])
@Index(['buyerNumber'])
@Index(['itemNumber'])
@Index(['reportingYear', 'reportingMonth'])
@Index(['uploadedAt'])
export class HobbyLobbyPOS {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  batchId: string;

  @ManyToOne(() => IngestionBatch, (batch: IngestionBatch) => batch.hobbyLobbyRows, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batchId' })
  batch: IngestionBatch;

  @Column({ type: 'varchar', length: 100, nullable: true })
  company?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vendorNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendorName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  buyerNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  buyerName?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  department?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  itemNumber?: string;

  @Column({ type: 'text', nullable: true })
  itemDescription?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vendorStockNumber?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  sellDown?: string | null;

  @Column({ type: 'int', default: 0 })
  onHand: number;

  @Column({ type: 'int', default: 0 })
  onOrder: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  firstCost?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  preprice?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  retailPrice?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  sales2Yr?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  salesLY?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  sales12M?: string | null;

  // 12 Last Year (LY) Monthly Sales Columns
  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lyJanSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lyFebSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lyMarSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lyAprSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lyMaySales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lyJunSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lyJulSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lyAugSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lySepSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lyOctSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lyNovSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  lyDecSales?: string | null;

  // 12 Current Year (CY) Monthly Sales Columns
  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cyJanSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cyFebSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cyMarSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cyAprSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cyMaySales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cyJunSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cyJulSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cyAugSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cySepSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cyOctSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cyNovSales?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  cyDecSales?: string | null;

  @Column({ type: 'int', nullable: true })
  reportingYear?: number | null;

  @Column({ type: 'int', nullable: true })
  reportingMonth?: number | null;

  @Column({ type: 'varchar', length: 100, default: 'portal_user' })
  uploadedBy: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
