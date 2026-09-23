import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { HobbyLobbyPOS } from './hobby-lobby-pos.entity';
import { FiveBelowPOS } from './five-below-pos.entity';
import { KohlsPOS } from './kohls-pos.entity';
import { MsiPOS } from './msi-pos.entity';

export enum RetailerCode {
  HOBBY_LOBBY = 'HOBBY_LOBBY',
  FIVE_BELOW = 'FIVE_BELOW',
  KOHLS = 'KOHLS',
  MSI = 'MSI',
  MIS = 'MIS',
}

export enum BatchStatus {
  PENDING = 'PENDING',
  VALIDATING = 'VALIDATING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED',
}

@Entity('IngestionBatch')
@Index(['retailerCode', 'uploadedAt'])
@Index(['status'])
export class IngestionBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RetailerCode,
    default: RetailerCode.HOBBY_LOBBY,
    nullable: true,
    name: 'retailer_code',
  })
  retailerCode: RetailerCode;

  @Column({ type: 'varchar', length: 255, nullable: true, default: 'uploaded_pos.csv', name: 'file_name' })
  fileName?: string | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'file_size_bytes' })
  fileSizeBytes?: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'report_family' })
  reportFamily?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'department_tag' })
  departmentTag?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'vendor_number_tag' })
  vendorNumberTag?: string | null;

  @Column({ type: 'int', nullable: true, name: 'reporting_year' })
  reportingYear?: number | null;

  @Column({ type: 'int', nullable: true, name: 'reporting_month' })
  reportingMonth?: number | null;

  @Column({ type: 'int', default: 0, nullable: true, name: 'total_rows' })
  totalRows?: number;

  @Column({ type: 'int', default: 0, nullable: true, name: 'valid_rows' })
  validRows?: number;

  @Column({ type: 'int', default: 0, nullable: true, name: 'error_rows' })
  errorRows?: number;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.PENDING,
    nullable: true,
    name: 'status',
  })
  status: BatchStatus;

  @Column({ type: 'jsonb', nullable: true, name: 'error_summary' })
  errorSummary?: any;

  @Column({ type: 'varchar', length: 100, default: 'portal_user', nullable: true, name: 'uploaded_by' })
  uploadedBy?: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', nullable: true, name: 'uploaded_at' })
  uploadedAt?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => HobbyLobbyPOS, (row: HobbyLobbyPOS) => row.batch)
  hobbyLobbyRows: HobbyLobbyPOS[];

  @OneToMany(() => FiveBelowPOS, (row: FiveBelowPOS) => row.batch)
  fiveBelowRows: FiveBelowPOS[];

  @OneToMany(() => KohlsPOS, (row: KohlsPOS) => row.batch)
  kohlsRows: KohlsPOS[];

  @OneToMany(() => MsiPOS, (row: MsiPOS) => row.batch)
  msiRows: MsiPOS[];
}
