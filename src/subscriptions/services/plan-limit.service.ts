import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Product } from '../../products/entities/product.entity';
import { Sale } from '../../sales/entities/sale.entity';
import {
  PlanFeature,
  PlanLimit,
} from '../constants/subscription.constants';
import {
  SubscriptionErrorCode,
} from '../constants/subscription-errors.constants';
import { SubscriptionAccessService } from './subscription-access.service';

export interface PlanUsageItem {
  current: number;
  limit: number | null;
}

export interface PlanUsage {
  products: PlanUsageItem;
  customers: PlanUsageItem;
  salesPerMonth: PlanUsageItem;
}

const LIMIT_CONFIG = {
  [PlanLimit.Products]: {
    feature: PlanFeature.Products,
    label: 'produtos',
  },
  [PlanLimit.Customers]: {
    feature: PlanFeature.Customers,
    label: 'clientes',
  },
  [PlanLimit.SalesPerMonth]: {
    feature: PlanFeature.Sales,
    label: 'vendas mensais',
  },
} as const;

type EnforcedLimit = keyof typeof LIMIT_CONFIG;

@Injectable()
export class PlanLimitService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    private readonly accessService: SubscriptionAccessService,
  ) {}

  async assertCanCreate(userId: string, limitName: EnforcedLimit): Promise<void> {
    const subscription = await this.accessService.getCurrentOrThrow(userId);
    const limit = subscription.plan.limits[limitName];
    if (limit === null) return;

    const currentUsage = await this.count(userId, limitName);
    if (currentUsage >= limit) {
      const config = LIMIT_CONFIG[limitName];
      throw new ForbiddenException({
        code: SubscriptionErrorCode.PlanLimitReached,
        message: `Você atingiu o limite de ${config.label} do seu plano. Faça upgrade para continuar.`,
        feature: config.feature,
        currentUsage,
        limit,
      });
    }
  }

  async getUsage(userId: string): Promise<PlanUsage> {
    const subscription = await this.accessService.getCurrentOrThrow(userId);
    const [products, customers, salesPerMonth] = await Promise.all([
      this.count(userId, PlanLimit.Products),
      this.count(userId, PlanLimit.Customers),
      this.count(userId, PlanLimit.SalesPerMonth),
    ]);

    return {
      products: { current: products, limit: subscription.plan.limits.products },
      customers: { current: customers, limit: subscription.plan.limits.customers },
      salesPerMonth: {
        current: salesPerMonth,
        limit: subscription.plan.limits.salesPerMonth,
      },
    };
  }

  private count(userId: string, limitName: EnforcedLimit): Promise<number> {
    if (limitName === PlanLimit.Products) {
      return this.productsRepository
        .createQueryBuilder('product')
        .where('product.user_id = :userId', { userId })
        .andWhere('product.deleted_at IS NULL')
        .getCount();
    }
    if (limitName === PlanLimit.Customers) {
      return this.customersRepository.count({ where: { userId } });
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return this.salesRepository
      .createQueryBuilder('sale')
      .where('sale.user_id = :userId', { userId })
      .andWhere('sale.sale_date >= :start AND sale.sale_date < :end', {
        start,
        end,
      })
      .getCount();
  }
}
