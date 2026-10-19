import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlans1700000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar NOT NULL,
        name varchar NOT NULL,
        description text NOT NULL,
        monthly_price decimal(12,2) NOT NULL,
        yearly_price decimal(12,2) NOT NULL,
        trial_days integer NULL,
        features jsonb NOT NULL,
        limits jsonb NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        is_recommended boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_plans_code UNIQUE (code),
        CONSTRAINT chk_plans_prices_non_negative
          CHECK (monthly_price >= 0 AND yearly_price >= 0),
        CONSTRAINT chk_plans_trial_days_non_negative
          CHECK (trial_days IS NULL OR trial_days >= 0)
      );

      CREATE INDEX idx_plans_code ON plans(code);
      CREATE INDEX idx_plans_is_active ON plans(is_active);
      CREATE INDEX idx_plans_created_at ON plans(created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS plans;');
  }
}
