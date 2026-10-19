import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustPlanLimits1700000005800 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE plans
      SET
        limits = '{"products":1000,"customers":1000,"salesPerMonth":1000}'::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'starter';

      UPDATE plans
      SET
        limits = '{"products":null,"customers":null,"salesPerMonth":null}'::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'pro';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE plans
      SET
        limits = '{"products":500,"customers":500,"salesPerMonth":1000}'::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'starter';

      UPDATE plans
      SET
        limits = '{"products":5000,"customers":5000,"salesPerMonth":10000}'::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'pro';
    `);
  }
}
