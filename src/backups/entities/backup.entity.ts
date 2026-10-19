import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum BackupStatus {
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export enum BackupTrigger {
  Automatic = 'automatic',
  Manual = 'manual',
}

@Entity('backups')
export class Backup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: BackupStatus })
  status: BackupStatus;

  @Column({ name: 'triggered_by', type: 'varchar', length: 20 })
  triggeredBy: BackupTrigger;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'content_type' })
  contentType: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes: string;

  @Column({ nullable: true })
  checksum: string | null;

  @Column({ type: 'bytea', nullable: true, select: false })
  data: Buffer | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
