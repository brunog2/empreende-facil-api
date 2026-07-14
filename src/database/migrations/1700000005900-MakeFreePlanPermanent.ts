import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeFreePlanPermanent1700000005900 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE plans
      SET
        name = 'Gratuito',
        description = 'Comece gratuitamente com os recursos essenciais e limites para sua operação.',
        monthly_price = 0.00,
        yearly_price = 0.00,
        trial_days = NULL,
        duration_months = NULL,
        features = '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true,"advancedReports":false,"dataExport":false,"automaticBackup":false,"prioritySupport":false,"premiumSupport":false}'::jsonb,
        limits = '{"products":30,"customers":30,"salesPerMonth":50}'::jsonb,
        is_active = true,
        is_recommended = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'trial';

      UPDATE subscriptions AS subscription
      SET
        status = CASE
          WHEN subscription.status = 'suspended'::subscription_status_enum
            THEN subscription.status
          ELSE 'active'::subscription_status_enum
        END,
        billing_cycle = 'monthly'::subscription_billing_cycle_enum,
        trial_starts_at = NULL,
        trial_ends_at = NULL,
        current_period_start = COALESCE(
          subscription.current_period_start,
          subscription.created_at,
          CURRENT_TIMESTAMP
        ),
        current_period_end = NULL,
        grace_period_ends_at = NULL,
        plan_access_ends_at = NULL,
        cancel_at_period_end = false,
        locked_monthly_price = NULL,
        locked_yearly_price = NULL,
        provider_subscription_id = NULL,
        updated_at = CURRENT_TIMESTAMP
      FROM plans AS plan
      WHERE subscription.plan_id = plan.id
        AND plan.code = 'trial';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE plans
      SET
        name = 'Plano Teste',
        description = 'Teste todos os recursos por 14 dias, sem cartão.',
        monthly_price = 0.00,
        yearly_price = 0.00,
        trial_days = 14,
        duration_months = NULL,
        features = '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true,"advancedReports":true,"dataExport":true,"automaticBackup":true,"prioritySupport":false,"premiumSupport":false}'::jsonb,
        limits = '{"products":30,"customers":30,"salesPerMonth":50}'::jsonb,
        is_active = true,
        is_recommended = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'trial';

      UPDATE subscriptions AS subscription
      SET
        status = 'trialing'::subscription_status_enum,
        trial_starts_at = CURRENT_TIMESTAMP,
        trial_ends_at = CURRENT_TIMESTAMP + INTERVAL '14 days',
        current_period_start = NULL,
        current_period_end = NULL,
        updated_at = CURRENT_TIMESTAMP
      FROM plans AS plan
      WHERE subscription.plan_id = plan.id
        AND plan.code = 'trial'
        AND subscription.status = 'active'::subscription_status_enum;
    `);
  }
}
