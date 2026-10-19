import { MigrationInterface, QueryRunner } from "typeorm";

export class LimitPlanCatalog1700000005700 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

      UPDATE plans
      SET
        name = 'Starter',
        description = 'Para MEI e negócios que estão começando.',
        monthly_price = 49.90,
        yearly_price = 598.80,
        trial_days = NULL,
        duration_months = NULL,
        features = '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true,"advancedReports":false,"dataExport":false,"automaticBackup":false,"prioritySupport":false,"premiumSupport":false}'::jsonb,
        limits = '{"products":500,"customers":500,"salesPerMonth":1000}'::jsonb,
        is_active = true,
        is_recommended = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'starter';

      UPDATE plans
      SET
        name = 'Pro',
        description = 'Para empresas que precisam de mais controle e recursos avançados.',
        monthly_price = 79.90,
        yearly_price = 958.80,
        trial_days = NULL,
        duration_months = NULL,
        features = '{"dashboard":true,"sales":true,"products":true,"categories":true,"customers":true,"expenses":true,"reports":true,"advancedReports":true,"dataExport":true,"automaticBackup":true,"prioritySupport":true,"premiumSupport":false}'::jsonb,
        limits = '{"products":5000,"customers":5000,"salesPerMonth":10000}'::jsonb,
        is_active = true,
        is_recommended = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'pro';

      UPDATE plans
      SET
        is_active = false,
        is_recommended = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE code IN ('founder', 'business');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE plans
      SET
        is_active = true,
        is_recommended = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE code IN ('founder', 'business');
    `);
  }
}
