import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import {
  BillingCycle,
  PaymentStatus,
  SubscriptionStatus,
} from '../constants/subscription.constants';
import {
  AdminPaymentFiltersDto,
  AdminSubscriptionFiltersDto,
} from '../dto/admin-subscription-filters.dto';
import {
  AdminChangePlanDto,
  ExtendTrialDto,
  SuspendSubscriptionDto,
  UpdateSubscriptionDto,
} from '../dto/subscription-actions.dto';
import { Payment } from '../entities/payment.entity';
import { Subscription } from '../entities/subscription.entity';
import { PlansService } from './plans.service';

interface StatusMetricsRow {
  total: string;
  trialing: string;
  active: string;
  pastDue: string;
  suspended: string;
  canceled: string;
  expired: string;
  newThisMonth: string;
  canceledThisMonth: string;
}

interface PlanMetricRow {
  code: string;
  name: string;
  count: string;
}

interface TimelineMetricRow {
  month: string;
  newSubscriptions: string;
  cancellations: string;
}

@Injectable()
export class AdminSubscriptionsService {
  private readonly logger = new Logger(AdminSubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly plansService: PlansService,
  ) {}

  async findAll(filters: AdminSubscriptionFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const query = this.subscriptionsRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .innerJoinAndSelect('subscription.plan', 'plan');

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(user.full_name) LIKE :search', { search })
            .orWhere('LOWER(user.email) LIKE :search', { search })
            .orWhere("LOWER(COALESCE(user.business_name, '')) LIKE :search", {
              search,
            });
        }),
      );
    }
    if (filters.plan) query.andWhere('plan.code = :plan', { plan: filters.plan });
    if (filters.status) {
      query.andWhere('subscription.status = :status', { status: filters.status });
    }
    if (filters.billingCycle) {
      query.andWhere('subscription.billing_cycle = :billingCycle', {
        billingCycle: filters.billingCycle,
      });
    }
    if (filters.startDate) {
      query.andWhere('subscription.created_at >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      query.andWhere('subscription.created_at <= :endDate', {
        endDate: filters.endDate,
      });
    }

    query
      .orderBy('subscription.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [subscriptions, total] = await query.getManyAndCount();
    const ids = subscriptions.map((subscription) => subscription.id);
    const payments = ids.length
      ? await this.paymentsRepository.find({
          where: { subscriptionId: In(ids), status: PaymentStatus.Paid },
          order: { paidAt: 'DESC' },
        })
      : [];
    const lastPayments = new Map<string, Payment>();
    for (const payment of payments) {
      if (!lastPayments.has(payment.subscriptionId)) {
        lastPayments.set(payment.subscriptionId, payment);
      }
    }

    return {
      data: subscriptions.map((subscription) =>
        this.toAdminSubscriptionResponse(
          subscription,
          lastPayments.get(subscription.id) ?? null,
        ),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getMetrics() {
    const statusRaw = (await this.subscriptionsRepository
      .createQueryBuilder('subscription')
      .select('COUNT(*)', 'total')
      .addSelect("COUNT(*) FILTER (WHERE subscription.status = 'trialing')", 'trialing')
      .addSelect("COUNT(*) FILTER (WHERE subscription.status = 'active')", 'active')
      .addSelect("COUNT(*) FILTER (WHERE subscription.status = 'past_due')", 'pastDue')
      .addSelect("COUNT(*) FILTER (WHERE subscription.status = 'suspended')", 'suspended')
      .addSelect("COUNT(*) FILTER (WHERE subscription.status = 'canceled')", 'canceled')
      .addSelect("COUNT(*) FILTER (WHERE subscription.status = 'expired')", 'expired')
      .addSelect(
        "COUNT(*) FILTER (WHERE subscription.created_at >= DATE_TRUNC('month', CURRENT_DATE))",
        'newThisMonth',
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE subscription.canceled_at >= DATE_TRUNC('month', CURRENT_DATE))",
        'canceledThisMonth',
      )
      .getRawOne()) as StatusMetricsRow;

    const byPlan = (await this.subscriptionsRepository
      .createQueryBuilder('subscription')
      .innerJoin('subscription.plan', 'plan')
      .select('plan.code', 'code')
      .addSelect('plan.name', 'name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('plan.id')
      .addGroupBy('plan.code')
      .addGroupBy('plan.name')
      .orderBy('count', 'DESC')
      .getRawMany()) as PlanMetricRow[];

    const mrrRaw = (await this.subscriptionsRepository.query(`
      SELECT COALESCE(SUM(
        CASE
          WHEN subscriptions.billing_cycle = 'yearly'
            THEN COALESCE(subscriptions.locked_yearly_price, plans.yearly_price) / 12
          ELSE COALESCE(subscriptions.locked_monthly_price, plans.monthly_price)
        END
      ), 0)::decimal(12,2)::text AS "estimatedMrr"
      FROM subscriptions
      INNER JOIN plans ON plans.id = subscriptions.plan_id
      WHERE subscriptions.status = 'active'
    `)) as Array<{ estimatedMrr: string }>;

    const confirmedRevenueRaw = (await this.paymentsRepository.query(`
      SELECT COALESCE(SUM(amount), 0)::decimal(12,2)::text AS "confirmedRevenueThisMonth"
      FROM payments
      WHERE status = 'paid'
        AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)
    `)) as Array<{ confirmedRevenueThisMonth: string }>;

    const timeline = (await this.subscriptionsRepository.query(`
      SELECT
        TO_CHAR(months.month, 'YYYY-MM') AS month,
        COUNT(subscriptions.id) FILTER (
          WHERE DATE_TRUNC('month', subscriptions.created_at) = months.month
        ) AS "newSubscriptions",
        COUNT(subscriptions.id) FILTER (
          WHERE DATE_TRUNC('month', subscriptions.canceled_at) = months.month
        ) AS cancellations
      FROM GENERATE_SERIES(
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
        DATE_TRUNC('month', CURRENT_DATE),
        INTERVAL '1 month'
      ) months(month)
      LEFT JOIN subscriptions
        ON DATE_TRUNC('month', subscriptions.created_at) = months.month
        OR DATE_TRUNC('month', subscriptions.canceled_at) = months.month
      GROUP BY months.month
      ORDER BY months.month
    `)) as TimelineMetricRow[];

    return {
      total: Number(statusRaw.total),
      trialing: Number(statusRaw.trialing),
      active: Number(statusRaw.active),
      pastDue: Number(statusRaw.pastDue),
      suspended: Number(statusRaw.suspended),
      canceled: Number(statusRaw.canceled),
      expired: Number(statusRaw.expired),
      byPlan: byPlan.map((item) => ({ ...item, count: Number(item.count) })),
      estimatedMrr: mrrRaw[0]?.estimatedMrr ?? '0.00',
      confirmedRevenueThisMonth:
        confirmedRevenueRaw[0]?.confirmedRevenueThisMonth ?? '0.00',
      newThisMonth: Number(statusRaw.newThisMonth),
      canceledThisMonth: Number(statusRaw.canceledThisMonth),
      timeline: timeline.map((item) => ({
        month: item.month,
        newSubscriptions: Number(item.newSubscriptions),
        cancellations: Number(item.cancellations),
      })),
    };
  }

  async findOne(id: string) {
    const subscription = await this.findSubscription(id, true);
    return this.toAdminSubscriptionResponse(subscription);
  }

  async update(id: string, data: UpdateSubscriptionDto, adminId: string) {
    const subscription = await this.findSubscription(id);
    if (data.status !== undefined) subscription.status = data.status;
    if (data.billingCycle !== undefined) subscription.billingCycle = data.billingCycle;
    if (data.currentPeriodEnd !== undefined) {
      subscription.currentPeriodEnd = this.parseDate(data.currentPeriodEnd);
    }
    if (data.gracePeriodEndsAt !== undefined) {
      subscription.gracePeriodEndsAt = this.parseDate(data.gracePeriodEndsAt);
    }
    const saved = await this.subscriptionsRepository.save(subscription);
    this.logAction('update', adminId, saved.id, data);
    return this.findOne(saved.id);
  }

  async extendTrial(id: string, data: ExtendTrialDto, adminId: string) {
    const subscription = await this.findSubscription(id);
    const base =
      subscription.trialEndsAt && subscription.trialEndsAt > new Date()
        ? subscription.trialEndsAt
        : new Date();
    const trialEndsAt = new Date(base);
    trialEndsAt.setDate(trialEndsAt.getDate() + data.days);
    subscription.trialEndsAt = trialEndsAt;
    subscription.status = SubscriptionStatus.Trialing;
    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;
    const saved = await this.subscriptionsRepository.save(subscription);
    this.logAction('extend-trial', adminId, id, { days: data.days });
    return this.findOne(saved.id);
  }

  async changePlan(id: string, data: AdminChangePlanDto, adminId: string) {
    const [subscription, plan] = await Promise.all([
      this.findSubscription(id),
      this.plansService.findByCode(data.planCode),
    ]);
    subscription.planId = plan.id;
    subscription.plan = plan;
    subscription.lockedMonthlyPrice =
      plan.code === 'founder' ? plan.monthlyPrice : null;
    subscription.lockedYearlyPrice =
      plan.code === 'founder' ? plan.yearlyPrice : null;
    if (data.billingCycle) subscription.billingCycle = data.billingCycle;
    const saved = await this.subscriptionsRepository.save(subscription);
    this.logAction('change-plan', adminId, id, {
      planCode: plan.code,
      billingCycle: subscription.billingCycle,
    });
    return this.findOne(saved.id);
  }

  async suspend(
    id: string,
    data: SuspendSubscriptionDto,
    adminId: string,
  ) {
    const subscription = await this.findSubscription(id);
    subscription.status = SubscriptionStatus.Suspended;
    subscription.gracePeriodEndsAt = null;
    const saved = await this.subscriptionsRepository.save(subscription);
    this.logAction('suspend', adminId, id, { reason: data.reason ?? null });
    return this.findOne(saved.id);
  }

  async reactivate(id: string, adminId: string) {
    const subscription = await this.findSubscription(id);
    const now = new Date();
    subscription.status =
      subscription.trialEndsAt && subscription.trialEndsAt > now
        ? SubscriptionStatus.Trialing
        : SubscriptionStatus.Active;
    subscription.gracePeriodEndsAt = null;
    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;
    if (subscription.status === SubscriptionStatus.Active) {
      subscription.currentPeriodStart ??= now;
      subscription.currentPeriodEnd ??= this.addBillingPeriod(
        now,
        subscription.billingCycle,
      );
    }
    const saved = await this.subscriptionsRepository.save(subscription);
    this.logAction('reactivate', adminId, id, {});
    return this.findOne(saved.id);
  }

  async findPayments(filters: AdminPaymentFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const query = this.paymentsRepository
      .createQueryBuilder('payment')
      .innerJoinAndSelect('payment.subscription', 'subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .innerJoinAndSelect('subscription.plan', 'plan');
    if (filters.status) query.andWhere('payment.status = :status', { status: filters.status });
    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(user.full_name) LIKE :search', { search }).orWhere(
            'LOWER(user.email) LIKE :search',
            { search },
          );
        }),
      );
    }
    query.orderBy('payment.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await query.getManyAndCount();
    return {
      data: data.map((payment) => this.toAdminPaymentResponse(payment)),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  private async findSubscription(id: string, payments = false): Promise<Subscription> {
    const relations = payments
      ? { user: true, plan: true, payments: true }
      : { user: true, plan: true };
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id },
      relations,
    });
    if (!subscription) throw new NotFoundException('Assinatura não encontrada.');
    return subscription;
  }

  private parseDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Data inválida.');
    return date;
  }

  private addBillingPeriod(date: Date, cycle: BillingCycle): Date {
    const result = new Date(date);
    if (cycle === BillingCycle.Yearly) result.setFullYear(result.getFullYear() + 1);
    else result.setMonth(result.getMonth() + 1);
    return result;
  }

  private logAction(
    action: string,
    adminId: string,
    subscriptionId: string,
    details: object,
  ): void {
    this.logger.log(JSON.stringify({ action, adminId, subscriptionId, details }));
  }

  private toAdminSubscriptionResponse(
    subscription: Subscription,
    lastPayment?: Payment | null,
  ) {
    return {
      id: subscription.id,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      trialStartsAt: subscription.trialStartsAt,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt,
      canceledAt: subscription.canceledAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      lockedMonthlyPrice: subscription.lockedMonthlyPrice,
      lockedYearlyPrice: subscription.lockedYearlyPrice,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      plan: subscription.plan,
      user: subscription.user
        ? {
            id: subscription.user.id,
            email: subscription.user.email,
            fullName: subscription.user.fullName,
            businessName: subscription.user.businessName,
            phone: subscription.user.phone,
            isActive: subscription.user.isActive,
            lastLoginAt: subscription.user.lastLoginAt,
          }
        : null,
      ...(lastPayment !== undefined && {
        lastPayment: lastPayment ? this.toSafePayment(lastPayment) : null,
      }),
      ...(subscription.payments && {
        payments: subscription.payments.map((payment) =>
          this.toSafePayment(payment),
        ),
      }),
    };
  }

  private toAdminPaymentResponse(payment: Payment) {
    return {
      ...this.toSafePayment(payment),
      provider: payment.provider,
      subscription: this.toAdminSubscriptionResponse(payment.subscription),
    };
  }

  private toSafePayment(payment: Payment) {
    return {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      dueDate: payment.dueDate,
      paidAt: payment.paidAt,
      failedAt: payment.failedAt,
      refundedAt: payment.refundedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
