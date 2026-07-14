import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleItemCostSnapshot1700000006100
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sale_items
      ADD COLUMN IF NOT EXISTS product_cost_price DECIMAL(10, 2);
    `);

    // O custo histórico exato das vendas antigas não existia. Para manter
    // compatibilidade, usamos o custo atual do produto como fotografia inicial.
    await queryRunner.query(`
      UPDATE sale_items AS sale_item
      SET product_cost_price = product.cost_price
      FROM products AS product
      WHERE sale_item.product_id = product.id
        AND sale_item.product_cost_price IS NULL;
    `);

    await queryRunner.query(`
      UPDATE sale_items
      SET product_cost_price = 0
      WHERE product_cost_price IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE sale_items
      ALTER COLUMN product_cost_price SET DEFAULT 0,
      ALTER COLUMN product_cost_price SET NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sale_items
      DROP COLUMN IF EXISTS product_cost_price;
    `);
  }
}
