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

  try {
    await dataSource.initialize();
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
    
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    await dataSource.destroy();
    // Não lançar erro para não impedir o startup se migrations falharem
    // A aplicação ainda pode iniciar se as tabelas já existirem
  }
}

