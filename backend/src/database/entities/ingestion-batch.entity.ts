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
  })
  retailerCode: RetailerCode;

  @Column({ type: 'varchar', length: 255, nullable: true, default: 'uploaded_pos.csv' })
  fileName?: string | null;

  @Column({ type: 'int', default: 0, nullable: true })
  fileSizeBytes?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reportFamily?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  departmentTag?: string | null;

  @Column({ type: 'int', default: 0, nullable: true })
  totalRows?: number;

  @Column({ type: 'int', default: 0, nullable: true })
  validRows?: number;

  @Column({ type: 'int', default: 0, nullable: true })
  errorRows?: number;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.PENDING,
    nullable: true,
  })
  status: BatchStatus;

  @Column({ type: 'jsonb', nullable: true })
  errorSummary?: any;

  @Column({ type: 'varchar', length: 100, default: 'portal_user', nullable: true })
  uploadedBy?: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  uploadedAt?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @OneToMany(() => HobbyLobbyPOS, (row) => row.batch)
  hobbyLobbyRows: HobbyLobbyPOS[];

  @OneToMany(() => FiveBelowPOS, (row) => row.batch)
  fiveBelowRows: FiveBelowPOS[];

  @OneToMany(() => KohlsPOS, (row) => row.batch)
  kohlsRows: KohlsPOS[];

  @OneToMany(() => MsiPOS, (row) => row.batch)
  msiRows: MsiPOS[];
}
