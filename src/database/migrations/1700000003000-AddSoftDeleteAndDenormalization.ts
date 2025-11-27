import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddSoftDeleteAndDenormalization1700000003000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna deleted_at na tabela products
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Criar índice em products.deleted_at para performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);
    `);

    // Adicionar colunas product_name e product_price na tabela sale_items
    await queryRunner.addColumn(
      'sale_items',
      new TableColumn({
        name: 'product_name',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'sale_items',
      new TableColumn({
        name: 'product_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );

    // Remover constraint RESTRICT e criar SET NULL
    // Primeiro, remover a constraint existente
    const table = await queryRunner.getTable('sale_items');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('product_id') !== -1 && fk.referencedTableName === 'products',
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('sale_items', foreignKey);
    }

    // Criar nova constraint com SET NULL
    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover constraint SET NULL e recriar RESTRICT
    const table = await queryRunner.getTable('sale_items');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('product_id') !== -1 && fk.referencedTableName === 'products',
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('sale_items', foreignKey);
    }

    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'RESTRICT',
      }),
    );

    // Remover colunas de sale_items
    await queryRunner.dropColumn('sale_items', 'product_price');
    await queryRunner.dropColumn('sale_items', 'product_name');

    // Remover índice
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_products_deleted_at;
    `);

    // Remover coluna deleted_at
    await queryRunner.dropColumn('products', 'deleted_at');
  }
}

