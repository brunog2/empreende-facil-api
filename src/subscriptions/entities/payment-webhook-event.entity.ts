import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WebhookProcessingStatus } from '../constants/subscription.constants';

@Entity('payment_webhook_events')
@Index('uq_payment_webhook_events_provider_event', ['provider', 'eventId'], {
  unique: true,
})
export class PaymentWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  provider: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ name: 'payload_hash' })
  payloadHash: string;

  @Column({ type: 'enum', enum: WebhookProcessingStatus })
  status: WebhookProcessingStatus;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
