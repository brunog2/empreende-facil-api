import { MigrationInterface, QueryRunner } from 'typeorm';

export class StopDoubleStockDeduction1700000006300 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const trigger = await queryRunner.query(`
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'on_sale_item_created'
        AND NOT tgisinternal
    `);

    if (trigger.length > 0) {
      await queryRunner.query(`
        UPDATE products AS product
        SET stock_quantity = product.stock_quantity + COALESCE((
          SELECT SUM(item.quantity)
          FROM sale_items AS item
          WHERE item.product_id = product.id
        ), 0)
      `);
    }

    await queryRunner.query(
      'DROP TRIGGER IF EXISTS on_sale_item_created ON sale_items',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS update_product_stock_on_sale()',
    );
  }

  public async down(): Promise<void> {
    return;
  }
}
