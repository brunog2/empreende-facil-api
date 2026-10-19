import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsAndWebhookEvents1700000005200
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE payment_status_enum AS ENUM (
        'pending', 'processing', 'paid', 'failed', 'refunded', 'canceled'
      );
      CREATE TYPE webhook_processing_status_enum AS ENUM (
        'processing', 'processed', 'failed'
      );

      CREATE TABLE payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id uuid NOT NULL,
        amount decimal(12,2) NOT NULL,
        status payment_status_enum NOT NULL,
        payment_method varchar NULL,
        provider varchar NOT NULL,
        provider_payment_id varchar NULL,
        due_date timestamp NULL,
        paid_at timestamp NULL,
        failed_at timestamp NULL,
        refunded_at timestamp NULL,
        metadata jsonb NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_payments_amount_non_negative CHECK (amount >= 0),
        CONSTRAINT fk_payments_subscription
          FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
      CREATE INDEX idx_payments_status ON payments(status);
      CREATE INDEX idx_payments_due_date ON payments(due_date);
      CREATE INDEX idx_payments_paid_at ON payments(paid_at);
      CREATE INDEX idx_payments_created_at ON payments(created_at);
      CREATE UNIQUE INDEX uq_payments_provider_payment_id
        ON payments(provider, provider_payment_id)
        WHERE provider_payment_id IS NOT NULL;

      CREATE TABLE payment_webhook_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        provider varchar NOT NULL,
        event_id varchar NOT NULL,
        payload_hash varchar NOT NULL,
        status webhook_processing_status_enum NOT NULL,
        processed_at timestamp NULL,
        error text NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_payment_webhook_events_provider_event
          UNIQUE (provider, event_id)
      );

      CREATE INDEX idx_payment_webhook_events_status
        ON payment_webhook_events(status);
      CREATE INDEX idx_payment_webhook_events_created_at
        ON payment_webhook_events(created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS payment_webhook_events;
      DROP TABLE IF EXISTS payments;
      DROP TYPE IF EXISTS webhook_processing_status_enum;
      DROP TYPE IF EXISTS payment_status_enum;
    `);
  }
}
