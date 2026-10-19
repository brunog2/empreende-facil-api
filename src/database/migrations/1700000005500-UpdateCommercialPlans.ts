import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCommercialPlans1700000005500
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE subscriptions
        ADD COLUMN locked_monthly_price decimal(12,2) NULL,
        ADD COLUMN locked_yearly_price decimal(12,2) NULL;

      UPDATE plans
      SET
        name = 'Plano Teste',
        description = 'Teste todos os recursos por 14 dias, sem cartão.',
        monthly_price = 0.00,
        yearly_price = 0.00,
        trial_days = 14,
        features = '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true,"advancedReports":true,"dataExport":true,"automaticBackup":true,"userPermissions":true,"prioritySupport":false,"premiumSupport":false}'::jsonb,
        limits = '{"products":30,"customers":30,"salesPerMonth":50,"users":1}'::jsonb,
        is_active = true,
        is_recommended = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'trial';

      UPDATE plans
      SET
        code = 'starter',
        name = 'Starter',
        description = 'Para MEI e negócios que estão começando.',
        monthly_price = 49.90,
        yearly_price = 598.80,
        trial_days = NULL,
        features = '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true,"advancedReports":false,"dataExport":false,"automaticBackup":false,"userPermissions":false,"prioritySupport":false,"premiumSupport":false}'::jsonb,
        limits = '{"products":500,"customers":500,"salesPerMonth":1000,"users":1}'::jsonb,
        is_active = true,
        is_recommended = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'essential';

      UPDATE plans
      SET
        code = 'pro',
        name = 'Pro',
        description = 'Para empresas com funcionários que precisam de mais controle.',
        monthly_price = 79.90,
        yearly_price = 958.80,
        trial_days = NULL,
        features = '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true,"advancedReports":true,"dataExport":true,"automaticBackup":true,"userPermissions":true,"prioritySupport":true,"premiumSupport":false}'::jsonb,
        limits = '{"products":5000,"customers":5000,"salesPerMonth":10000,"users":5}'::jsonb,
        is_active = true,
        is_recommended = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'professional';

      INSERT INTO plans (
        code, name, description, monthly_price, yearly_price, trial_days,
        features, limits, is_active, is_recommended
      ) VALUES
      (
        'business', 'Business',
        'Para empresas maiores que precisam de operação sem limites.',
        129.90, 1558.80, NULL,
        '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true,"advancedReports":true,"dataExport":true,"automaticBackup":true,"userPermissions":true,"prioritySupport":true,"premiumSupport":true}'::jsonb,
        '{"products":null,"customers":null,"salesPerMonth":null,"users":null}'::jsonb,
        true, false
      ),
      (
        'founder', 'Plano Fundador',
        'Condição especial de lançamento com os recursos do Pro por R$ 39,90/mês para sempre.',
        39.90, 478.80, NULL,
        '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true,"advancedReports":true,"dataExport":true,"automaticBackup":true,"userPermissions":true,"prioritySupport":true,"premiumSupport":false}'::jsonb,
        '{"products":5000,"customers":5000,"salesPerMonth":10000,"users":5}'::jsonb,
        true, false
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        monthly_price = EXCLUDED.monthly_price,
        yearly_price = EXCLUDED.yearly_price,
        trial_days = EXCLUDED.trial_days,
        features = EXCLUDED.features,
        limits = EXCLUDED.limits,
        is_active = EXCLUDED.is_active,
        is_recommended = EXCLUDED.is_recommended,
        updated_at = CURRENT_TIMESTAMP;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE subscriptions
      SET plan_id = (SELECT id FROM plans WHERE code = 'starter')
      WHERE plan_id IN (
        SELECT id FROM plans WHERE code IN ('business', 'founder')
      );

      DELETE FROM plans WHERE code IN ('business', 'founder');

      UPDATE plans
      SET
        code = 'essential',
        name = 'Essencial',
        description = 'Os recursos essenciais para organizar e fazer seu negócio crescer.',
        monthly_price = 49.90,
        yearly_price = 499.00,
        features = '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true}'::jsonb,
        limits = '{"products":500,"customers":500,"salesPerMonth":1000,"users":1}'::jsonb,
        is_recommended = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'starter';

      UPDATE plans
      SET
        code = 'professional',
        name = 'Profissional',
        description = 'Mais capacidade, relatórios completos e espaço para sua equipe.',
        monthly_price = 99.90,
        yearly_price = 999.00,
        features = '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true}'::jsonb,
        limits = '{"products":null,"customers":null,"salesPerMonth":null,"users":5}'::jsonb,
        is_recommended = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'pro';

      UPDATE plans
      SET
        description = 'Teste todos os recursos do Gestão Pro por 14 dias.',
        features = '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true}'::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'trial';

      ALTER TABLE subscriptions
        DROP COLUMN locked_yearly_price,
        DROP COLUMN locked_monthly_price;
    `);
  }
}
