import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReportsBackupsAndPlanDuration1700000005600
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE plans
        ADD COLUMN duration_months integer NULL,
        ADD CONSTRAINT chk_plans_duration_months
          CHECK (duration_months IS NULL OR duration_months > 0);

      ALTER TABLE subscriptions
        ADD COLUMN plan_access_ends_at timestamptz NULL;

      CREATE INDEX idx_subscriptions_plan_access_ends_at
        ON subscriptions(plan_access_ends_at);

      CREATE TYPE backup_status_enum AS ENUM ('processing', 'completed', 'failed');

      CREATE TABLE backups (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        status backup_status_enum NOT NULL DEFAULT 'processing',
        triggered_by varchar(20) NOT NULL,
        file_name varchar(255) NOT NULL,
        content_type varchar(100) NOT NULL DEFAULT 'application/gzip',
        size_bytes bigint NOT NULL DEFAULT 0,
        checksum varchar(64) NULL,
        data bytea NULL,
        error text NULL,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at timestamptz NULL,
        CONSTRAINT fk_backups_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_backups_triggered_by
          CHECK (triggered_by IN ('automatic', 'manual')),
        CONSTRAINT chk_backups_size
          CHECK (size_bytes >= 0)
      );

      CREATE INDEX idx_backups_user_id ON backups(user_id);
      CREATE INDEX idx_backups_status ON backups(status);
      CREATE INDEX idx_backups_created_at ON backups(created_at);
      CREATE INDEX idx_backups_user_created_at ON backups(user_id, created_at DESC);

      UPDATE plans
      SET
        features = features - 'userPermissions',
        limits = limits - 'users',
        updated_at = CURRENT_TIMESTAMP;

      UPDATE plans
      SET
        duration_months = 3,
        description = 'Condição especial de lançamento com os recursos do Pro por R$ 39,90/mês durante 3 meses.',
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'founder';

      UPDATE subscriptions
      SET plan_access_ends_at = CURRENT_TIMESTAMP + INTERVAL '3 months'
      WHERE plan_id = (SELECT id FROM plans WHERE code = 'founder')
        AND plan_access_ends_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE plans
      SET
        features = features || jsonb_build_object(
          'userPermissions',
          code IN ('trial', 'pro', 'business', 'founder')
        ),
        limits = limits || jsonb_build_object(
          'users',
          CASE
            WHEN code IN ('trial', 'starter') THEN 1
            WHEN code IN ('pro', 'founder') THEN 5
            ELSE NULL
          END
        ),
        updated_at = CURRENT_TIMESTAMP;

      UPDATE plans
      SET
        description = 'Condição especial de lançamento com os recursos do Pro por R$ 39,90/mês para sempre.',
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'founder';

      DROP TABLE IF EXISTS backups;
      DROP TYPE IF EXISTS backup_status_enum;
      DROP INDEX IF EXISTS idx_subscriptions_plan_access_ends_at;
      ALTER TABLE subscriptions DROP COLUMN plan_access_ends_at;
      ALTER TABLE plans DROP CONSTRAINT chk_plans_duration_months;
      ALTER TABLE plans DROP COLUMN duration_months;
    `);
  }
}
