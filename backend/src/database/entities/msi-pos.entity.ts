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

@Entity('msi_pos')
@Index(['batchId'])
@Index(['storeId'])
@Index(['receiptNumber'])
@Index(['department'])
@Index(['uploadedAt'])
export class MsiPOS {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'batch_id' })
  batchId: string;

  @ManyToOne(() => IngestionBatch, (b: IngestionBatch) => b.msiRows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: IngestionBatch;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'store_id' })
  storeId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'register_id' })
  registerId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'cashier_id' })
  cashierId?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'shift_id' })
  shiftId?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'receipt_number' })
  receiptNumber?: string;

  @Column({ type: 'int', default: 1, nullable: true, name: 'line_number' })
  lineNumber?: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'sku' })
  sku?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'description' })
  description?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'department' })
  department?: string | null;

  @Column({ type: 'int', default: 1, nullable: true, name: 'quantity' })
  quantity?: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'unit_price' })
  unitPrice?: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0, nullable: true, name: 'discount_amount' })
  discountAmount?: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0, nullable: true, name: 'tax_amount' })
  taxAmount?: string;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'total_amount' })
  totalAmount?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'tender_type' })
  tenderType: string | null; // CASH, CARD, GIFT_CARD

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', name: 'transaction_time' })
  transactionTime: Date;

  @Column({ type: 'varchar', length: 100, default: 'portal_user', name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', name: 'uploaded_at' })
  uploadedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;
}

