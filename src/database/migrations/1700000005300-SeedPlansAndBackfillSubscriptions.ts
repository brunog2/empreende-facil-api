import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPlansAndBackfillSubscriptions1700000005300
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO plans (
        code, name, description, monthly_price, yearly_price, trial_days,
        features, limits, is_active, is_recommended
      ) VALUES
      (
        'trial', 'Plano Teste',
        'Teste todos os recursos do Gestão Pro por 14 dias.',
        0.00, 0.00, 14,
        '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true}'::jsonb,
        '{"products":30,"customers":30,"salesPerMonth":50,"users":1}'::jsonb,
        true, false
      ),
      (
        'essential', 'Essencial',
        'Os recursos essenciais para organizar e fazer seu negócio crescer.',
        49.90, 499.00, NULL,
        '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true}'::jsonb,
        '{"products":500,"customers":500,"salesPerMonth":1000,"users":1}'::jsonb,
        true, true
      ),
      (
        'professional', 'Profissional',
        'Mais capacidade, relatórios completos e espaço para sua equipe.',
        99.90, 999.00, NULL,
        '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true}'::jsonb,
        '{"products":null,"customers":null,"salesPerMonth":null,"users":5}'::jsonb,
        true, false
      )
      ON CONFLICT (code) DO NOTHING;

      UPDATE users
      SET permissions = permissions || '["reports"]'::jsonb
      WHERE NOT permissions @> '["reports"]'::jsonb;

      INSERT INTO subscriptions (
        user_id, plan_id, status, billing_cycle, trial_starts_at,
        trial_ends_at, provider
      )
      SELECT
        users.id,
        plans.id,
        'trialing'::subscription_status_enum,
        'monthly'::subscription_billing_cycle_enum,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '14 days',
        'migration-backfill'
      FROM users
      CROSS JOIN plans
      WHERE users.role = 'customer'
        AND plans.code = 'trial'
        AND NOT EXISTS (
          SELECT 1 FROM subscriptions WHERE subscriptions.user_id = users.id
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM subscriptions WHERE provider = 'migration-backfill';
      UPDATE users SET permissions = permissions - 'reports';
      DELETE FROM plans
      WHERE code IN ('trial', 'essential', 'professional')
        AND NOT EXISTS (
          SELECT 1 FROM subscriptions WHERE subscriptions.plan_id = plans.id
        );
    `);
  }
}
