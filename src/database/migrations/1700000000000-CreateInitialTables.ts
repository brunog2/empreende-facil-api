import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInitialTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Lista de todas as tabelas que esta migration cria
    const requiredTables = [
      'users',
      'categories',
      'products',
      'customers',
      'expenses',
      'sales',
      'sale_items',
    ];

    // Verificar se TODAS as tabelas necessárias já existem
    const tablesExistPromises = requiredTables.map((table) =>
      queryRunner.hasTable(table),
    );
    const tablesExist = await Promise.all(tablesExistPromises);
    const allTablesExist = tablesExist.every((exists) => exists === true);

    if (allTablesExist) {
      console.log('Todas as tabelas já existem. Pulando criação inicial...');
      return;
    }

    // Se algumas tabelas existem mas outras não, logar quais estão faltando
    const missingTables = requiredTables.filter(
      (_, index) => !tablesExist[index],
    );
    if (missingTables.length > 0) {
      console.log(
        `Algumas tabelas estão faltando: ${missingTables.join(', ')}. Criando apenas as tabelas faltantes...`,
      );
    }

    // Create users table (apenas se não existir)
    if (!tablesExist[0]) {
      await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'full_name',
            type: 'varchar',
          },
          {
            name: 'business_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
      );
    }

    // Create categories table (apenas se não existir)
    if (!tablesExist[1]) {
      await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
      );

      await queryRunner.createForeignKey(
        'categories',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'categories',
        new TableIndex({
          name: 'idx_categories_user_id',
          columnNames: ['user_id'],
        }),
      );

      await queryRunner.createIndex(
        'categories',
        new TableIndex({
          name: 'idx_categories_user_name',
          columnNames: ['user_id', 'name'],
          isUnique: true,
        }),
      );
    }

    // Create products table (apenas se não existir)
    if (!tablesExist[2]) {
      await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'cost_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'sale_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'stock_quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
      );

      await queryRunner.createForeignKey(
        'products',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'products',
        new TableForeignKey({
          columnNames: ['category'],
          referencedColumnNames: ['id'],
          referencedTableName: 'categories',
          onDelete: 'SET NULL',
        }),
      );

      await queryRunner.createIndex(
        'products',
        new TableIndex({
          name: 'idx_products_user_id',
          columnNames: ['user_id'],
        }),
      );
    }

    // Create customers table (apenas se não existir)
    if (!tablesExist[3]) {
      await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'customers',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'customers',
      new TableIndex({
        name: 'idx_customers_user_id',
        columnNames: ['user_id'],
      }),
      );
    }

    // Create expenses table (apenas se não existir)
    if (!tablesExist[4]) {
      await queryRunner.createTable(
      new Table({
        name: 'expenses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'category',
            type: 'varchar',
          },
          {
            name: 'expense_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'is_recurring',
            type: 'boolean',
            default: false,
          },
          {
            name: 'recurrence_period',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'expenses',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'expenses',
      new TableIndex({
        name: 'idx_expenses_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'expenses',
      new TableIndex({
        name: 'idx_expenses_date',
        columnNames: ['expense_date'],
      }),
      );
    }

    // Create sales table (apenas se não existir)
    if (!tablesExist[5]) {
      await queryRunner.createTable(
      new Table({
        name: 'sales',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'payment_method',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sale_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'idx_sales_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'idx_sales_date',
        columnNames: ['sale_date'],
      }),
      );
    }

    // Create sale_items table (apenas se não existir)
    if (!tablesExist[6]) {
      await queryRunner.createTable(
      new Table({
        name: 'sale_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'sale_id',
            type: 'uuid',
          },
          {
            name: 'product_id',
            type: 'uuid',
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
          },
          {
            name: 'unit_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
      );
    }

    // Criar foreign keys e índices apenas se as tabelas relacionadas existirem
    // Foreign keys para categories
    if (!tablesExist[1] || !tablesExist[0]) {
      // Só criar se a tabela categories acabou de ser criada
      if (!tablesExist[1]) {
        await queryRunner.createForeignKey(
          'categories',
          new TableForeignKey({
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
          }),
        );
      }
    }

    // Foreign keys para products
    if (!tablesExist[2]) {
      await queryRunner.createForeignKey(
        'products',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'products',
        new TableForeignKey({
          columnNames: ['category'],
          referencedColumnNames: ['id'],
          referencedTableName: 'categories',
          onDelete: 'SET NULL',
        }),
      );
    }

    // Foreign keys para customers
    if (!tablesExist[3]) {
      await queryRunner.createForeignKey(
        'customers',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }

    // Foreign keys para expenses
    if (!tablesExist[4]) {
      await queryRunner.createForeignKey(
        'expenses',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }

    // Foreign keys para sales
    if (!tablesExist[5]) {
      await queryRunner.createForeignKey(
        'sales',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'sales',
        new TableForeignKey({
          columnNames: ['customer_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'customers',
          onDelete: 'SET NULL',
        }),
      );
    }

    // Foreign keys para sale_items
    if (!tablesExist[6]) {
      await queryRunner.createForeignKey(
        'sale_items',
        new TableForeignKey({
          columnNames: ['sale_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'sales',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'sale_items',
        new TableForeignKey({
          columnNames: ['product_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'products',
          onDelete: 'RESTRICT',
        }),
      );
    }

    // Create function to update updated_at (CREATE OR REPLACE é seguro)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at (DROP IF EXISTS para evitar erros)
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_products_updated_at ON products;
      CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
      CREATE TRIGGER update_customers_updated_at
      BEFORE UPDATE ON customers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
      CREATE TRIGGER update_expenses_updated_at
      BEFORE UPDATE ON expenses
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
      CREATE TRIGGER update_categories_updated_at
      BEFORE UPDATE ON categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create trigger to update product stock on sale (CREATE OR REPLACE é seguro)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS on_sale_item_created ON sale_items;
      CREATE TRIGGER on_sale_item_created
      AFTER INSERT ON sale_items
      FOR EACH ROW
      EXECUTE FUNCTION update_product_stock_on_sale();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sale_items', true);
    await queryRunner.dropTable('sales', true);
    await queryRunner.dropTable('expenses', true);
    await queryRunner.dropTable('customers', true);
    await queryRunner.dropTable('products', true);
    await queryRunner.dropTable('categories', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.query('DROP FUNCTION IF EXISTS update_product_stock_on_sale() CASCADE;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;');
  }
}


