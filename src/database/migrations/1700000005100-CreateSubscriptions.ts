import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptions1700000005100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE subscription_status_enum AS ENUM (
        'trialing', 'active', 'past_due', 'suspended', 'canceled', 'expired'
      );
      CREATE TYPE subscription_billing_cycle_enum AS ENUM ('monthly', 'yearly');

      CREATE TABLE subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NULL,
        plan_id uuid NOT NULL,
        status subscription_status_enum NOT NULL,
        billing_cycle subscription_billing_cycle_enum NOT NULL,
        trial_starts_at timestamp NULL,
        trial_ends_at timestamp NULL,
        current_period_start timestamp NULL,
        current_period_end timestamp NULL,
        grace_period_ends_at timestamp NULL,
        canceled_at timestamp NULL,
        cancel_at_period_end boolean NOT NULL DEFAULT false,
        provider varchar NULL,
        provider_customer_id varchar NULL,
        provider_subscription_id varchar NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_subscriptions_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_subscriptions_plan
          FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
      );

      CREATE UNIQUE INDEX uq_subscriptions_user_id
        ON subscriptions(user_id) WHERE user_id IS NOT NULL;
      CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX idx_subscriptions_status ON subscriptions(status);
      CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
      CREATE INDEX idx_subscriptions_trial_ends_at ON subscriptions(trial_ends_at);
      CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);
      CREATE INDEX idx_subscriptions_grace_period_ends_at ON subscriptions(grace_period_ends_at);
      CREATE INDEX idx_subscriptions_created_at ON subscriptions(created_at);
      CREATE INDEX idx_subscriptions_canceled_at ON subscriptions(canceled_at);
      CREATE UNIQUE INDEX uq_subscriptions_provider_subscription_id
        ON subscriptions(provider, provider_subscription_id)
        WHERE provider_subscription_id IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS subscriptions;
      DROP TYPE IF EXISTS subscription_billing_cycle_enum;
      DROP TYPE IF EXISTS subscription_status_enum;
    `);
  }
}
