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

@Entity('KohlsPOS')
@Index(['batchId'])
@Index(['storeNumber'])
@Index(['sku'])
@Index(['department'])
@Index(['uploadedAt'])
export class KohlsPOS {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  batchId: string;

  @ManyToOne(() => IngestionBatch, (b) => b.kohlsRows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batchId' })
  batch: IngestionBatch;

  @Column({ type: 'varchar', length: 50 })
  storeNumber: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  storeName: string | null;

  @Column({ type: 'varchar', length: 50 })
  vendorNumber: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  upc: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  styleNumber: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  colorCode: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sizeCode: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  department: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  className: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  subclass: string | null;

  @Column({ type: 'int', default: 0 })
  posUnits: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  posDollars: string;

  @Column({ type: 'int', default: 0 })
  regularUnits: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  regularDollars: string;

  @Column({ type: 'int', default: 0 })
  markdownUnits: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  markdownDollars: string;

  @Column({ type: 'int', default: 0 })
  returnUnits: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0 })
  returnDollars: string;

  @Column({ type: 'int', default: 0 })
  storeOHUnits: number;

  @Column({ type: 'int', default: 0 })
  onOrderUnits: number;

  @Column({ type: 'int', default: 0 })
  inTransitUnits: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  weekEndDate: Date | null;

  @Column({ type: 'varchar', length: 100, default: 'portal_user' })
  uploadedBy: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
