import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableStarterAdvancedReports1700000006000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE plans
      SET
        features = jsonb_set(
          jsonb_set(features, '{advancedReports}', 'true'::jsonb, true),
          '{dataExport}',
          'false'::jsonb,
          true
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'starter';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE plans
      SET
        features = jsonb_set(
          jsonb_set(features, '{advancedReports}', 'false'::jsonb, true),
          '{dataExport}',
          'false'::jsonb,
          true
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE code = 'starter';
    `);
  }
}
