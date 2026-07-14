import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionStatus } from '../constants/subscription.constants';
import { Subscription } from '../entities/subscription.entity';

@Injectable()
export class SubscriptionJobsService {
  private readonly logger = new Logger(SubscriptionJobsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async reconcileExpiredSubscriptions(): Promise<void> {
    const result = await this.subscriptionsRepository.query(`
      WITH updated AS (
        UPDATE subscriptions
        SET
          status = CASE
            WHEN plan_access_ends_at IS NOT NULL
              AND plan_access_ends_at <= CURRENT_TIMESTAMP
              THEN 'expired'::subscription_status_enum
            WHEN status = 'trialing' AND trial_ends_at <= CURRENT_TIMESTAMP
              THEN 'expired'::subscription_status_enum
            WHEN status = 'past_due'
              AND (grace_period_ends_at IS NULL OR grace_period_ends_at <= CURRENT_TIMESTAMP)
              THEN 'suspended'::subscription_status_enum
            WHEN cancel_at_period_end = true
              AND COALESCE(current_period_end, trial_ends_at) <= CURRENT_TIMESTAMP
              THEN 'canceled'::subscription_status_enum
            WHEN status = 'active' AND current_period_end <= CURRENT_TIMESTAMP
              THEN 'expired'::subscription_status_enum
            ELSE status
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE
          (plan_access_ends_at IS NOT NULL
            AND plan_access_ends_at <= CURRENT_TIMESTAMP
            AND status IN ('trialing', 'active', 'past_due'))
          OR (status = 'trialing' AND trial_ends_at <= CURRENT_TIMESTAMP)
          OR (status = 'past_due'
            AND (grace_period_ends_at IS NULL OR grace_period_ends_at <= CURRENT_TIMESTAMP))
          OR (cancel_at_period_end = true
            AND COALESCE(current_period_end, trial_ends_at) <= CURRENT_TIMESTAMP)
          OR (status = 'active' AND current_period_end <= CURRENT_TIMESTAMP)
        RETURNING id
      )
      SELECT COUNT(*)::int AS count FROM updated;
    `) as Array<{ count: number }>;
    if ((result[0]?.count ?? 0) > 0) {
      this.logger.log(`Assinaturas reconciliadas: ${result[0].count}`);
    }
  }
}
