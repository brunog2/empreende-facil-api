import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subscription } from "../entities/subscription.entity";

@Injectable()
export class SubscriptionJobsService {
  private readonly logger = new Logger(SubscriptionJobsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async reconcileExpiredSubscriptions(): Promise<void> {
    const result = (await this.subscriptionsRepository.query(`
      WITH free_plan AS (
        SELECT id
        FROM plans
        WHERE code = 'trial' AND is_active = true
        LIMIT 1
      ), updated AS (
        UPDATE subscriptions AS subscription
        SET
          plan_id = free_plan.id,
          status = 'active'::subscription_status_enum,
          billing_cycle = 'monthly'::subscription_billing_cycle_enum,
          trial_starts_at = NULL,
          trial_ends_at = NULL,
          current_period_start = CURRENT_TIMESTAMP,
          current_period_end = NULL,
          grace_period_ends_at = NULL,
          plan_access_ends_at = NULL,
          cancel_at_period_end = false,
          locked_monthly_price = NULL,
          locked_yearly_price = NULL,
          provider_subscription_id = NULL,
          updated_at = CURRENT_TIMESTAMP
        FROM free_plan
        WHERE
          subscription.plan_id <> free_plan.id
          AND (
            (subscription.plan_access_ends_at IS NOT NULL
              AND subscription.plan_access_ends_at <= CURRENT_TIMESTAMP
              AND subscription.status IN ('trialing', 'active', 'past_due'))
            OR (subscription.status = 'trialing'
              AND (subscription.trial_ends_at IS NULL
                OR subscription.trial_ends_at <= CURRENT_TIMESTAMP))
            OR (subscription.status = 'past_due'
              AND (subscription.grace_period_ends_at IS NULL
                OR subscription.grace_period_ends_at <= CURRENT_TIMESTAMP))
            OR (subscription.cancel_at_period_end = true
              AND COALESCE(
                subscription.current_period_end,
                subscription.trial_ends_at
              ) <= CURRENT_TIMESTAMP)
            OR (subscription.status = 'active'
              AND subscription.current_period_end <= CURRENT_TIMESTAMP)
            OR subscription.status IN ('canceled', 'expired')
          )
        RETURNING subscription.id
      )
      SELECT COUNT(*)::int AS count FROM updated;
    `)) as Array<{ count: number }>;
    if ((result[0]?.count ?? 0) > 0) {
      this.logger.log(`Assinaturas reconciliadas: ${result[0].count}`);
    }
  }
}
