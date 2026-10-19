import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { UserRole } from "../../users/user-access.constants";
import {
  BillingCycle,
  FREE_PLAN_CODE,
  PaymentStatus,
  SubscriptionStatus,
} from "../constants/subscription.constants";
import {
  SUBSCRIPTION_MESSAGES,
  SubscriptionErrorCode,
} from "../constants/subscription-errors.constants";
import { CreateCheckoutDto } from "../dto/subscription-actions.dto";
import { Payment } from "../entities/payment.entity";
import { Plan } from "../entities/plan.entity";
import { Subscription } from "../entities/subscription.entity";
import { PaymentProviderRegistry } from "../providers/payment-provider.registry";
import { PlanLimitService } from "./plan-limit.service";
import { PlansService } from "./plans.service";
import { SubscriptionAccessService } from "./subscription-access.service";

type CheckoutAction = "checkout" | "change_plan" | "regularization";

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly plansService: PlansService,
    private readonly accessService: SubscriptionAccessService,
    private readonly limitService: PlanLimitService,
    private readonly providerRegistry: PaymentProviderRegistry,
    private readonly configService: ConfigService,
  ) {}

  async createFreeSubscriptionForUser(
    user: User,
    manager: EntityManager,
  ): Promise<Subscription | null> {
    if (user.role !== UserRole.Customer) return null;

    const subscriptionRepository = manager.getRepository(Subscription);
    const existing = await subscriptionRepository.findOne({
      where: { userId: user.id },
    });
    if (existing) return existing;

    const freePlan = await manager.getRepository(Plan).findOne({
      where: { code: FREE_PLAN_CODE, isActive: true },
    });
    if (!freePlan) {
      throw new BadRequestException({
        code: SubscriptionErrorCode.PlanNotFound,
        message: "O plano gratuito padrão não está configurado.",
      });
    }

    const now = new Date();

    return subscriptionRepository.save(
      subscriptionRepository.create({
        userId: user.id,
        planId: freePlan.id,
        status: SubscriptionStatus.Active,
        billingCycle: BillingCycle.Monthly,
        trialStartsAt: null,
        trialEndsAt: null,
        currentPeriodStart: now,
        currentPeriodEnd: null,
        gracePeriodEndsAt: null,
        planAccessEndsAt: null,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        lockedMonthlyPrice: null,
        lockedYearlyPrice: null,
        provider: "internal",
        providerCustomerId: null,
        providerSubscriptionId: null,
      }),
    );
  }

  async getMine(userId: string) {
    const subscription = await this.accessService.assertAccess(userId);
    return this.toSubscriptionResponse(subscription);
  }

  getUsage(userId: string) {
    return this.limitService.getUsage(userId);
  }

  async getPayments(userId: string) {
    const subscription = await this.accessService.getCurrentOrThrow(userId);
    const payments = await this.paymentsRepository.find({
      where: { subscriptionId: subscription.id },
      order: { createdAt: "DESC" },
    });
    return payments.map((payment) => this.toPaymentResponse(payment));
  }

  checkout(userId: string, data: CreateCheckoutDto) {
    return this.createPendingCheckout(userId, data, "checkout");
  }

  changePlan(userId: string, data: CreateCheckoutDto) {
    return this.createPendingCheckout(userId, data, "change_plan");
  }

  async cancel(userId: string) {
    const subscription = await this.accessService.getCurrentOrThrow(userId);
    if (subscription.plan.code === FREE_PLAN_CODE) {
      throw new BadRequestException(
        "O plano gratuito não precisa ser cancelado.",
      );
    }
    if (
      subscription.status === SubscriptionStatus.Canceled ||
      subscription.status === SubscriptionStatus.Expired
    ) {
      throw new BadRequestException("Esta assinatura já está encerrada.");
    }

    if (subscription.providerSubscriptionId && subscription.provider) {
      const provider = this.providerRegistry.get(subscription.provider);
      await provider.cancelSubscription(subscription.providerSubscriptionId);
    }

    subscription.cancelAtPeriodEnd = true;
    subscription.canceledAt = new Date();
    await this.subscriptionsRepository.save(subscription);
    return this.toSubscriptionResponse(subscription);
  }

  async reactivate(userId: string) {
    const subscription = await this.accessService.getCurrentOrThrow(userId);
    const accessEnd = subscription.currentPeriodEnd ?? subscription.trialEndsAt;
    const canUndoCancellation =
      subscription.cancelAtPeriodEnd && accessEnd && accessEnd > new Date();

    if (!canUndoCancellation) {
      throw new ForbiddenException({
        code: SubscriptionErrorCode.PaymentConfirmationPending,
        message:
          SUBSCRIPTION_MESSAGES[
            SubscriptionErrorCode.PaymentConfirmationPending
          ],
      });
    }

    if (subscription.providerSubscriptionId && subscription.provider) {
      const provider = this.providerRegistry.get(subscription.provider);
      await provider.reactivateSubscription(
        subscription.providerSubscriptionId,
      );
    }

    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;
    await this.subscriptionsRepository.save(subscription);
    return this.toSubscriptionResponse(subscription);
  }

  private async createPendingCheckout(
    userId: string,
    data: CreateCheckoutDto,
    action: CheckoutAction,
  ) {
    const [subscription, plan, user] = await Promise.all([
      this.accessService.getCurrentOrThrow(userId),
      this.plansService.findActiveByCode(data.planCode),
      this.usersRepository.findOne({ where: { id: userId } }),
    ]);
    if (!user) throw new BadRequestException("Usuário não encontrado.");
    if (plan.code === FREE_PLAN_CODE) {
      throw new BadRequestException(
        "O plano gratuito é ativado automaticamente no cadastro.",
      );
    }
    if (plan.durationMonths && data.billingCycle === BillingCycle.Yearly) {
      throw new BadRequestException(
        "Este plano promocional está disponível apenas no ciclo mensal.",
      );
    }

    const providerName = this.configService.get<string>(
      "PAYMENT_PROVIDER",
      "mock",
    );
    const provider = this.providerRegistry.get(providerName);
    const isCurrentPlan = subscription.planId === plan.id;
    const amount =
      data.billingCycle === BillingCycle.Yearly
        ? (isCurrentPlan && subscription.lockedYearlyPrice) || plan.yearlyPrice
        : (isCurrentPlan && subscription.lockedMonthlyPrice) ||
          plan.monthlyPrice;

    const payment = await this.paymentsRepository.save(
      this.paymentsRepository.create({
        subscriptionId: subscription.id,
        amount,
        status: PaymentStatus.Pending,
        paymentMethod: null,
        provider: provider.name,
        providerPaymentId: null,
        dueDate: null,
        paidAt: null,
        failedAt: null,
        refundedAt: null,
        metadata: {
          action,
          targetPlanId: plan.id,
          targetPlanCode: plan.code,
          billingCycle: data.billingCycle,
        },
      }),
    );

    try {
      const customer = await provider.createCustomer({
        userId,
        name: user.fullName,
        email: user.email,
      });
      const checkout = await provider.createCheckout({
        paymentId: payment.id,
        customerId: customer.id,
        planCode: plan.code,
        billingCycle: data.billingCycle,
        amount,
        description: `Assinatura Gestão Pro - ${plan.name}`,
      });

      payment.providerPaymentId = checkout.providerPaymentId;
      payment.status = checkout.status;
      await this.paymentsRepository.save(payment);

      subscription.provider = provider.name;
      subscription.providerCustomerId = customer.id;
      await this.subscriptionsRepository.save(subscription);

      return {
        code: SubscriptionErrorCode.PaymentConfirmationPending,
        message:
          SUBSCRIPTION_MESSAGES[
            SubscriptionErrorCode.PaymentConfirmationPending
          ],
        checkoutUrl: checkout.checkoutUrl,
        payment: this.toPaymentResponse(payment),
      };
    } catch (error) {
      payment.status = PaymentStatus.Failed;
      payment.failedAt = new Date();
      await this.paymentsRepository.save(payment);
      throw new BadGatewayException({
        code: SubscriptionErrorCode.CheckoutCreationFailed,
        message:
          SUBSCRIPTION_MESSAGES[SubscriptionErrorCode.CheckoutCreationFailed],
      });
    }
  }

  private toSubscriptionResponse(subscription: Subscription) {
    return {
      id: subscription.id,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      trialStartsAt: subscription.trialStartsAt,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt,
      planAccessEndsAt: subscription.planAccessEndsAt,
      canceledAt: subscription.canceledAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      lockedMonthlyPrice: subscription.lockedMonthlyPrice,
      lockedYearlyPrice: subscription.lockedYearlyPrice,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      plan: subscription.plan,
    };
  }

  private toPaymentResponse(payment: Payment) {
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
