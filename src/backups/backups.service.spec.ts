import { ConfigService } from '@nestjs/config';
import { gunzipSync } from 'zlib';
import { DataSource, Repository } from 'typeorm';
import { BackupsService } from './backups.service';
import { Backup, BackupStatus, BackupTrigger } from './entities/backup.entity';

describe('BackupsService', () => {
  it('gera um backup compactado sem expor a senha da conta', async () => {
    const savedSnapshots: Backup[] = [];
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    const repository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      create: jest.fn((value) => value),
      save: jest.fn(async (value: Backup) => {
        savedSnapshots.push({
          ...value,
          data: value.data ? Buffer.from(value.data) : null,
        });
        return { id: 'backup-id', ...value };
      }),
    } as unknown as Repository<Backup>;
    const dataSource = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM users WHERE id')) {
          return [
            {
              id: 'user-id',
              email: 'cliente@teste.com',
              full_name: 'Cliente Teste',
            },
          ];
        }
        if (sql.includes('FROM subscriptions s')) return [];
        return [];
      }),
    } as unknown as DataSource;
    const config = { get: jest.fn((_key, fallback) => fallback) } as unknown as ConfigService;
    const service = new BackupsService(repository, dataSource, config);

    const result = await service.createManual('user-id');
    const completed = savedSnapshots.find(
      (backup) => backup.status === BackupStatus.Completed,
    );

    expect(result).toMatchObject({
      status: BackupStatus.Completed,
      triggeredBy: BackupTrigger.Manual,
      data: null,
    });
    expect(completed?.data).toBeInstanceOf(Buffer);
    if (!completed?.data) throw new Error('Backup compactado não foi gerado.');
    const snapshot = JSON.parse(gunzipSync(completed.data).toString('utf8'));
    expect(snapshot.account.email).toBe('cliente@teste.com');
    expect(snapshot.account.password).toBeUndefined();
  });
});
