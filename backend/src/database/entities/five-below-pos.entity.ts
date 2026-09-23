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

@Entity('FiveBelowPOS')
@Index(['batchId'])
@Index(['reportFamily'])
@Index(['department'])
@Index(['sku'])
@Index(['gtin'])
@Index(['uploadedAt'])
export class FiveBelowPOS {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  batchId: string;

  @ManyToOne(() => IngestionBatch, (b) => b.fiveBelowRows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batchId' })
  batch: IngestionBatch;

  @Column({ type: 'varchar', length: 100 })
  reportFamily: string; // BOOKS, PARTY_GAG, CREATE, STATIONARY, TOY, etc.

  @Column({ type: 'varchar', length: 50, nullable: true })
  reportDate: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  department: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  subDepartment: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  className: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  subClassName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vendorNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendorName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  styleId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  styleDesc: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  skuDesc: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gtin: string | null;

  @Column({ type: 'int', nullable: true })
  vendorCasePack: number | null;

  @Column({ type: 'int', nullable: true })
  innerCasePack: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  firstReceiptDate: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastReceiptDate: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  currUnitRetailPrice: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  itemCost: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  landedCost: string | null;

  @Column({ type: 'int', default: 0, nullable: true })
  salesUWTD: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  salesDWTD: string | null;

  @Column({ type: 'int', default: 0, nullable: true })
  salesULCW: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  salesDLCW: string | null;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  storeSellThruLCW: string | null;

  @Column({ type: 'int', default: 0, nullable: true })
  storesWithSalesLCW: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  storesWithOH: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  salesUL6W: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  salesUYTD: number | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  salesDYTD: string | null;

  @Column({ type: 'int', default: 0, nullable: true })
  invOHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  storeOHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  dcOHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  dc3OHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  dc4OHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  dc5OHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  dc6OHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  dc7OHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  totalPackawayOHU: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  wohLCW: string | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  storeWohLCW: string | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  dcWohLCW: string | null;

  @Column({ type: 'int', default: 0, nullable: true })
  currOOU: number | null;

  @Column({ type: 'varchar', length: 100, default: 'portal_user' })
  uploadedBy: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
