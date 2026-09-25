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

@Entity('five_below_pos')
@Index(['batchId'])
@Index(['reportFamily'])
@Index(['department'])
@Index(['sku'])
@Index(['gtin'])
@Index(['uploadedAt'])
export class FiveBelowPOS {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'batch_id' })
  batchId: string;

  @ManyToOne(() => IngestionBatch, (b: IngestionBatch) => b.fiveBelowRows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: IngestionBatch;

  @Column({ type: 'varchar', length: 100, name: 'report_family' })
  reportFamily: string; // BOOKS, PARTY_GAG, CREATE, STATIONARY, TOY, etc.

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'report_date' })
  reportDate: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'department' })
  department: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'sub_department' })
  subDepartment: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'class_name' })
  className: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'sub_class_name' })
  subClassName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'vendor_number' })
  vendorNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'vendor_name' })
  vendorName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'style_id' })
  styleId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'style_desc' })
  styleDesc: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'sku' })
  sku: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'sku_desc' })
  skuDesc: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'gtin' })
  gtin: string | null;

  @Column({ type: 'int', nullable: true, name: 'vendor_case_pack' })
  vendorCasePack: number | null;

  @Column({ type: 'int', nullable: true, name: 'inner_case_pack' })
  innerCasePack: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'first_receipt_date' })
  firstReceiptDate: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'last_receipt_date' })
  lastReceiptDate: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'curr_unit_retail_price' })
  currUnitRetailPrice: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'item_cost' })
  itemCost: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'landed_cost' })
  landedCost: string | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'sales_u_wtd' })
  salesUWTD: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'sales_d_wtd' })
  salesDWTD: string | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'sales_u_lcw' })
  salesULCW: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true, name: 'sales_d_lcw' })
  salesDLCW: string | null;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true, name: 'store_sell_thru_lcw' })
  storeSellThruLCW: string | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'stores_with_sales_lcw' })
  storesWithSalesLCW: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'stores_with_oh' })
  storesWithOH: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'sales_u_l6w' })
  salesUL6W: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'sales_u_ytd' })
  salesUYTD: number | null;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: true, name: 'sales_d_ytd' })
  salesDYTD: string | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'inv_oh_u' })
  invOHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'store_oh_u' })
  storeOHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'dc_oh_u' })
  dcOHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'dc3_oh_u' })
  dc3OHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'dc4_oh_u' })
  dc4OHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'dc5_oh_u' })
  dc5OHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'dc6_oh_u' })
  dc6OHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'dc7_oh_u' })
  dc7OHU: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'total_packaway_oh_u' })
  totalPackawayOHU: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'woh_lcw' })
  wohLCW: string | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'store_woh_lcw' })
  storeWohLCW: string | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'dc_woh_lcw' })
  dcWohLCW: string | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'curr_oo_u' })
  currOOU: number | null;

  @Column({ type: 'varchar', length: 100, default: 'portal_user', name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', name: 'uploaded_at' })
  uploadedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;
}

