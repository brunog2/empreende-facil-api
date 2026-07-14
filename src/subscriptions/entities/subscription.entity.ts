import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  BillingCycle,
  SubscriptionStatus,
} from '../constants/subscription.constants';
import { Payment } from './payment.entity';
import { Plan } from './plan.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @OneToOne(() => User, (user) => user.subscription, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ type: 'enum', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @Column({ name: 'billing_cycle', type: 'enum', enum: BillingCycle })
  billingCycle: BillingCycle;

  @Column({ name: 'trial_starts_at', type: 'timestamptz', nullable: true })
  trialStartsAt: Date | null;

  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  trialEndsAt: Date | null;

  @Column({ name: 'current_period_start', type: 'timestamptz', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ name: 'grace_period_ends_at', type: 'timestamptz', nullable: true })
  gracePeriodEndsAt: Date | null;

  @Column({ name: 'canceled_at', type: 'timestamptz', nullable: true })
  canceledAt: Date | null;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({
    name: 'locked_monthly_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  lockedMonthlyPrice: string | null;

  @Column({
    name: 'locked_yearly_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  lockedYearlyPrice: string | null;

  @Column({ nullable: true })
  provider: string | null;

  @Column({ name: 'provider_customer_id', nullable: true })
  providerCustomerId: string | null;

  @Column({ name: 'provider_subscription_id', nullable: true })
  providerSubscriptionId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Payment, (payment) => payment.subscription)
  payments: Payment[];
}
