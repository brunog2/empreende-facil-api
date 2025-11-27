import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterProductsStockQuantityToDecimal1700000002000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alterar a coluna stock_quantity de int para decimal
    await queryRunner.query(`
      ALTER TABLE products 
      ALTER COLUMN stock_quantity TYPE DECIMAL(10, 3) USING stock_quantity::DECIMAL(10, 3);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter para int (arredondando valores decimais)
    await queryRunner.query(`
      ALTER TABLE products 
      ALTER COLUMN stock_quantity TYPE INTEGER USING ROUND(stock_quantity)::INTEGER;
    `);
  }
}

