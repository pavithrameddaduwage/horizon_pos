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

@Entity('MsiPOS')
@Index(['batchId'])
@Index(['storeId'])
@Index(['receiptNumber'])
@Index(['department'])
@Index(['uploadedAt'])
export class MsiPOS {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  batchId: string;

  @ManyToOne(() => IngestionBatch, (b) => b.msiRows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batchId' })
  batch: IngestionBatch;

  @Column({ type: 'varchar', length: 50, nullable: true })
  storeId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  registerId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cashierId?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  shiftId?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  receiptNumber?: string;

  @Column({ type: 'int', default: 1, nullable: true })
  lineNumber?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  department?: string | null;

  @Column({ type: 'int', default: 1, nullable: true })
  quantity?: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  unitPrice?: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0, nullable: true })
  discountAmount?: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0, nullable: true })
  taxAmount?: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  totalAmount?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tenderType: string | null; // CASH, CARD, GIFT_CARD

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  transactionTime: Date;

  @Column({ type: 'varchar', length: 100, default: 'portal_user' })
  uploadedBy: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
