import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  PlanFeatures,
  PlanLimits,
} from '../constants/subscription.constants';
import { Subscription } from './subscription.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'monthly_price', type: 'decimal', precision: 12, scale: 2 })
  monthlyPrice: string;

  @Column({ name: 'yearly_price', type: 'decimal', precision: 12, scale: 2 })
  yearlyPrice: string;

  @Column({ name: 'trial_days', type: 'integer', nullable: true })
  trialDays: number | null;

  @Column({ type: 'jsonb' })
  features: PlanFeatures;

  @Column({ type: 'jsonb' })
  limits: PlanLimits;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_recommended', default: false })
  isRecommended: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];
}
