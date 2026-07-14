import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { promisify } from 'util';
import { gzip } from 'zlib';
import { DataSource, LessThan, Repository } from 'typeorm';
import { PlanFeature } from '../subscriptions/constants/subscription.constants';
import {
  Backup,
  BackupStatus,
  BackupTrigger,
} from './entities/backup.entity';

const gzipAsync = promisify(gzip);

interface BackupSnapshot {
  version: number;
  generatedAt: string;
  account: Record<string, unknown> | null;
  subscription: Record<string, unknown> | null;
  products: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  sales: Record<string, unknown>[];
  saleItems: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
}

@Injectable()
export class BackupsService {
  constructor(
    @InjectRepository(Backup)
    private readonly backupRepository: Repository<Backup>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  list(userId: string) {
    return this.backupRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 30,
    });
  }

  async createManual(userId: string) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recent = await this.backupRepository
      .createQueryBuilder('backup')
      .where('backup.user_id = :userId', { userId })
      .andWhere('backup.triggered_by = :trigger', {
        trigger: BackupTrigger.Manual,
      })
      .andWhere('backup.created_at >= :createdAt', {
        createdAt: fiveMinutesAgo,
      })
      .getOne();

    if (recent) {
      throw new HttpException(
        {
          code: 'BACKUP_RATE_LIMITED',
          message: 'Aguarde 5 minutos antes de gerar outro backup manual.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return this.generate(userId, BackupTrigger.Manual);
  }

  async download(userId: string, backupId: string) {
    const backup = await this.backupRepository
      .createQueryBuilder('backup')
      .addSelect('backup.data')
      .where('backup.id = :backupId', { backupId })
      .andWhere('backup.user_id = :userId', { userId })
      .getOne();

    if (!backup) {
      throw new NotFoundException({
        code: 'BACKUP_NOT_FOUND',
        message: 'Backup não encontrado.',
      });
    }

    if (backup.status !== BackupStatus.Completed || !backup.data) {
      throw new ConflictException({
        code: 'BACKUP_NOT_READY',
        message: 'Este backup ainda não está disponível para download.',
      });
    }

    return backup;
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async generateDailyBackups() {
    const accounts = await this.dataSource.query<{ user_id: string }[]>(
      `
        SELECT s.user_id
        FROM subscriptions s
        INNER JOIN plans p ON p.id = s.plan_id
        INNER JOIN users u ON u.id = s.user_id
        WHERE u.is_active = true
          AND p.is_active = true
          AND COALESCE((p.features ->> $1)::boolean, false) = true
          AND (
            s.status IN ('trialing', 'active')
            OR (s.status = 'past_due' AND s.grace_period_ends_at > CURRENT_TIMESTAMP)
          )
          AND (s.plan_access_ends_at IS NULL OR s.plan_access_ends_at > CURRENT_TIMESTAMP)
      `,
      [PlanFeature.AutomaticBackup],
    );

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfNextDay = new Date(
      startOfDay.getTime() + 24 * 60 * 60 * 1000,
    );

    for (const account of accounts) {
      const todayBackup = await this.backupRepository
        .createQueryBuilder('backup')
        .where('backup.user_id = :userId', { userId: account.user_id })
        .andWhere('backup.triggered_by = :trigger', {
          trigger: BackupTrigger.Automatic,
        })
        .andWhere('backup.created_at >= :startOfDay', { startOfDay })
        .andWhere('backup.created_at < :startOfNextDay', { startOfNextDay })
        .getExists();
      if (todayBackup) continue;

      await this.generate(account.user_id, BackupTrigger.Automatic);
    }

    await this.removeExpiredBackups();
  }

  private async generate(userId: string, trigger: BackupTrigger) {
    const now = new Date();
    const fileName = `gestao-pro-backup-${this.fileTimestamp(now)}.json.gz`;
    const backup = await this.backupRepository.save(
      this.backupRepository.create({
        userId,
        status: BackupStatus.Processing,
        triggeredBy: trigger,
        fileName,
        contentType: 'application/gzip',
        sizeBytes: '0',
        checksum: null,
        data: null,
        error: null,
        completedAt: null,
      }),
    );

    try {
      const snapshot = await this.buildSnapshot(userId);
      const compressed = await gzipAsync(
        Buffer.from(JSON.stringify(snapshot), 'utf8'),
      );
      backup.status = BackupStatus.Completed;
      backup.data = compressed;
      backup.sizeBytes = String(compressed.length);
      backup.checksum = createHash('sha256').update(compressed).digest('hex');
      backup.completedAt = new Date();
      const saved = await this.backupRepository.save(backup);
      saved.data = null;
      return saved;
    } catch (error) {
      backup.status = BackupStatus.Failed;
      backup.error =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Falha desconhecida ao gerar backup.';
      backup.completedAt = new Date();
      await this.backupRepository.save(backup);
      throw error;
    }
  }

  private async buildSnapshot(userId: string): Promise<BackupSnapshot> {
    const [account] = await this.dataSource.query<Record<string, unknown>[]>(
      `SELECT id, email, full_name, business_name, phone, role, is_active,
              permissions, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId],
    );
    const [subscription] = await this.dataSource.query<Record<string, unknown>[]>(
      `SELECT s.id, s.status, s.billing_cycle, s.trial_starts_at,
              s.trial_ends_at, s.current_period_start, s.current_period_end,
              s.grace_period_ends_at, s.canceled_at, s.cancel_at_period_end,
              s.plan_access_ends_at, s.created_at, s.updated_at,
              p.code AS plan_code, p.name AS plan_name
       FROM subscriptions s
       INNER JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1`,
      [userId],
    );

    const [products, categories, customers, sales, saleItems, expenses] =
      await Promise.all([
        this.dataSource.query<Record<string, unknown>[]>(
          'SELECT * FROM products WHERE user_id = $1 ORDER BY created_at',
          [userId],
        ),
        this.dataSource.query<Record<string, unknown>[]>(
          'SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at',
          [userId],
        ),
        this.dataSource.query<Record<string, unknown>[]>(
          'SELECT * FROM customers WHERE user_id = $1 ORDER BY created_at',
          [userId],
        ),
        this.dataSource.query<Record<string, unknown>[]>(
          'SELECT * FROM sales WHERE user_id = $1 ORDER BY created_at',
          [userId],
        ),
        this.dataSource.query<Record<string, unknown>[]>(
          `SELECT si.* FROM sale_items si
           INNER JOIN sales s ON s.id = si.sale_id
           WHERE s.user_id = $1 ORDER BY si.created_at`,
          [userId],
        ),
        this.dataSource.query<Record<string, unknown>[]>(
          'SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at',
          [userId],
        ),
      ]);

    if (!account) {
      throw new NotFoundException('Conta não encontrada para gerar o backup.');
    }

    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      account,
      subscription: subscription ?? null,
      products,
      categories,
      customers,
      sales,
      saleItems,
      expenses,
    };
  }

  private async removeExpiredBackups() {
    const retentionDays = Math.max(
      1,
      this.configService.get<number>('BACKUP_RETENTION_DAYS', 90),
    );
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    await this.backupRepository.delete({ createdAt: LessThan(cutoff) });
  }

  private fileTimestamp(date: Date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }
}
