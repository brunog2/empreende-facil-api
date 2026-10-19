import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePlanPrices1700000006200 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE plans
      SET
        monthly_price = CASE code
          WHEN 'starter' THEN 29.90
          WHEN 'pro' THEN 59.90
        END,
        yearly_price = CASE code
          WHEN 'starter' THEN 358.80
          WHEN 'pro' THEN 718.80
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE code IN ('starter', 'pro');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE plans
      SET
        monthly_price = CASE code
          WHEN 'starter' THEN 49.90
          WHEN 'pro' THEN 79.90
        END,
        yearly_price = CASE code
          WHEN 'starter' THEN 598.80
          WHEN 'pro' THEN 958.80
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE code IN ('starter', 'pro');
    `);
  }
}
