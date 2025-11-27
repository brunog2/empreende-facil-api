import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterSaleItemsQuantityToDecimal1700000001000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alterar a coluna quantity de int para decimal
    await queryRunner.query(`
      ALTER TABLE sale_items 
      ALTER COLUMN quantity TYPE DECIMAL(10, 3) USING quantity::DECIMAL(10, 3);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter para int (arredondando valores decimais)
    await queryRunner.query(`
      ALTER TABLE sale_items 
      ALTER COLUMN quantity TYPE INTEGER USING ROUND(quantity)::INTEGER;
    `);
  }
}

