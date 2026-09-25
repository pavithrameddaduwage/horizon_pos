import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IngestionBatch } from './ingestion-batch.entity';

@Entity('kohls_pos')
@Index(['batchId'])
@Index(['storeNumber'])
@Index(['sku'])
@Index(['department'])
@Index(['uploadedAt'])
export class KohlsPOS {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'batch_id' })
  batchId: string;

  @ManyToOne(() => IngestionBatch, (b: IngestionBatch) => b.kohlsRows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: IngestionBatch;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'store_number' })
  storeNumber?: string;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'store_name' })
  storeName?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'vendor_number' })
  vendorNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'sku' })
  sku?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'upc' })
  upc?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'style_number' })
  styleNumber?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'color_code' })
  colorCode?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'size_code' })
  sizeCode?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'department' })
  department?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'class_name' })
  className?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'subclass' })
  subclass?: string | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'pos_units' })
  posUnits?: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0, nullable: true, name: 'pos_dollars' })
  posDollars?: string;

  @Column({ type: 'int', default: 0, nullable: true, name: 'regular_units' })
  regularUnits?: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0, nullable: true, name: 'regular_dollars' })
  regularDollars?: string;

  @Column({ type: 'int', default: 0, nullable: true, name: 'markdown_units' })
  markdownUnits?: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0, nullable: true, name: 'markdown_dollars' })
  markdownDollars?: string;

  @Column({ type: 'int', default: 0, nullable: true, name: 'return_units' })
  returnUnits?: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0, nullable: true, name: 'return_dollars' })
  returnDollars?: string;

  @Column({ type: 'int', default: 0, nullable: true, name: 'store_oh_units' })
  storeOHUnits?: number;

  @Column({ type: 'int', default: 0, nullable: true, name: 'on_order_units' })
  onOrderUnits?: number;

  @Column({ type: 'int', default: 0, nullable: true, name: 'in_transit_units' })
  inTransitUnits?: number;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'week_end_date' })
  weekEndDate: Date | null;

  @Column({ type: 'varchar', length: 100, default: 'portal_user', name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', name: 'uploaded_at' })
  uploadedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;
}

