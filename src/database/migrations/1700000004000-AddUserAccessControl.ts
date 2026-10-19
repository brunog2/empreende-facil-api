import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAccessControl1700000004000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role varchar NOT NULL DEFAULT 'customer',
      ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL
        DEFAULT '["dashboard","sales","products","categories","customers","expenses"]'::jsonb,
      ADD COLUMN IF NOT EXISTS last_login_at timestamp NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_is_active;
      DROP INDEX IF EXISTS idx_users_role;
      ALTER TABLE users
      DROP COLUMN IF EXISTS last_login_at,
      DROP COLUMN IF EXISTS permissions,
      DROP COLUMN IF EXISTS is_active,
      DROP COLUMN IF EXISTS role;
    `);
  }
}

