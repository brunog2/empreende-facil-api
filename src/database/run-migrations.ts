import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export async function runMigrations(configService: ConfigService): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_DATABASE', 'empreende_facil'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    ssl: configService.get('NODE_ENV') === 'production' ? {
      rejectUnauthorized: false,
    } : false,
  });

  let isInitialized = false;
  try {
    await dataSource.initialize();
    isInitialized = true;
    console.log('Running migrations...');
    const migrations = await dataSource.runMigrations();
    
    if (migrations.length > 0) {
      console.log(`✅ Executed ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`  - ${migration.name}`);
      });
    } else {
      console.log('✅ No pending migrations');
    }
    
    if (isInitialized) {
      await dataSource.destroy();
    }
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    if (isInitialized) {
      try {
        await dataSource.destroy();
      } catch (destroyError) {
        console.error('❌ Error destroying data source:', destroyError);
      }
    }
    // Não lançar erro para não impedir o startup se migrations falharem
    // A aplicação ainda pode iniciar se as tabelas já existirem
  }
}

