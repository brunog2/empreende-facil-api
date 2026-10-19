import { MigrationInterface, QueryRunner } from 'typeorm';

export class UseTimezoneAwareSubscriptionDates1700000005400
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE plans
        ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

      ALTER TABLE subscriptions
        ALTER COLUMN trial_starts_at TYPE timestamptz USING (
          CASE WHEN provider = 'migration-backfill'
            THEN trial_starts_at AT TIME ZONE 'UTC'
            ELSE trial_starts_at AT TIME ZONE 'America/Maceio'
          END
        ),
        ALTER COLUMN trial_ends_at TYPE timestamptz USING (
          CASE WHEN provider = 'migration-backfill'
            THEN trial_ends_at AT TIME ZONE 'UTC'
            ELSE trial_ends_at AT TIME ZONE 'America/Maceio'
          END
        ),
        ALTER COLUMN current_period_start TYPE timestamptz
          USING current_period_start AT TIME ZONE 'America/Maceio',
        ALTER COLUMN current_period_end TYPE timestamptz
          USING current_period_end AT TIME ZONE 'America/Maceio',
        ALTER COLUMN grace_period_ends_at TYPE timestamptz
          USING grace_period_ends_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN canceled_at TYPE timestamptz
          USING canceled_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

      ALTER TABLE payments
        ALTER COLUMN due_date TYPE timestamptz
          USING due_date AT TIME ZONE 'America/Maceio',
        ALTER COLUMN paid_at TYPE timestamptz
          USING paid_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN failed_at TYPE timestamptz
          USING failed_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN refunded_at TYPE timestamptz
          USING refunded_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

      ALTER TABLE payment_webhook_events
        ALTER COLUMN processed_at TYPE timestamptz
          USING processed_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE payment_webhook_events
        ALTER COLUMN processed_at TYPE timestamp USING processed_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC';

      ALTER TABLE payments
        ALTER COLUMN due_date TYPE timestamp USING due_date AT TIME ZONE 'America/Maceio',
        ALTER COLUMN paid_at TYPE timestamp USING paid_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN failed_at TYPE timestamp USING failed_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN refunded_at TYPE timestamp USING refunded_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC';

      ALTER TABLE subscriptions
        ALTER COLUMN trial_starts_at TYPE timestamp USING trial_starts_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN trial_ends_at TYPE timestamp USING trial_ends_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN current_period_start TYPE timestamp USING current_period_start AT TIME ZONE 'America/Maceio',
        ALTER COLUMN current_period_end TYPE timestamp USING current_period_end AT TIME ZONE 'America/Maceio',
        ALTER COLUMN grace_period_ends_at TYPE timestamp USING grace_period_ends_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN canceled_at TYPE timestamp USING canceled_at AT TIME ZONE 'America/Maceio',
        ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC';

      ALTER TABLE plans
        ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC';
    `);
  }
}
