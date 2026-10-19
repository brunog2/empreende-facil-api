import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  BillingCycle,
  FREE_PLAN_CODE,
  PlanFeature,
  SubscriptionStatus,
} from "../constants/subscription.constants";
import {
  FEATURE_LABELS,
  SUBSCRIPTION_MESSAGES,
  SubscriptionErrorCode,
} from "../constants/subscription-errors.constants";
import { Subscription } from "../entities/subscription.entity";
import { Plan } from "../entities/plan.entity";

@Injectable()
export class SubscriptionAccessService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>,
  ) {}

  async getCurrent(userId: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({
      where: { userId },
      relations: { plan: true },
    });
  }

  async getCurrentOrThrow(userId: string): Promise<Subscription> {
    const subscription = await this.getCurrent(userId);
    if (!subscription) {
      throw new NotFoundException({
        code: SubscriptionErrorCode.SubscriptionNotFound,
        message:
          SUBSCRIPTION_MESSAGES[SubscriptionErrorCode.SubscriptionNotFound],
      });
    }
    return subscription;
  }

  async assertAccess(
    userId: string,
    feature?: PlanFeature,
  ): Promise<Subscription> {
    const subscription = await this.getCurrentOrThrow(userId);
    await this.assertValidStatus(subscription);

    if (feature && !subscription.plan.features[feature]) {
      throw new ForbiddenException({
        code: SubscriptionErrorCode.FeatureNotIncluded,
        message: `O recurso ${FEATURE_LABELS[feature]} não está incluído no seu plano atual.`,
        feature,
      });
    }

    return subscription;
  }

  async assertValidStatus(
    subscription: Subscription,
    now = new Date(),
  ): Promise<void> {
    if (subscription.plan.code === FREE_PLAN_CODE) {
      if (subscription.status === SubscriptionStatus.Suspended) {
        this.throwBlocked(SubscriptionErrorCode.SubscriptionSuspended);
      }
      if (
        subscription.status !== SubscriptionStatus.Active ||
        subscription.trialEndsAt ||
        subscription.currentPeriodEnd ||
        subscription.planAccessEndsAt ||
        subscription.cancelAtPeriodEnd
      ) {
        await this.activateFreePlan(subscription);
      }
      return;
    }

    if (subscription.planAccessEndsAt && subscription.planAccessEndsAt <= now) {
      await this.activateFreePlan(subscription);
      return;
    }

    if (subscription.status === SubscriptionStatus.Trialing) {
      if (!subscription.trialEndsAt || subscription.trialEndsAt <= now) {
        await this.activateFreePlan(subscription);
      }
      return;
    }

    if (subscription.status === SubscriptionStatus.Active) {
      if (
        subscription.currentPeriodEnd &&
        subscription.currentPeriodEnd <= now
      ) {
        await this.activateFreePlan(subscription);
      }
      return;
    }

    if (subscription.status === SubscriptionStatus.PastDue) {
      if (
        subscription.gracePeriodEndsAt &&
        subscription.gracePeriodEndsAt > now
      ) {
        return;
      }
      await this.activateFreePlan(subscription);
      return;
    }

    if (subscription.status === SubscriptionStatus.Suspended) {
      this.throwBlocked(SubscriptionErrorCode.SubscriptionSuspended);
    }

    if (
      subscription.status === SubscriptionStatus.Canceled ||
      subscription.status === SubscriptionStatus.Expired
    ) {
      await this.activateFreePlan(subscription);
      return;
    }

    this.throwBlocked(SubscriptionErrorCode.SubscriptionExpired);
  }

  private async activateFreePlan(subscription: Subscription): Promise<void> {
    const freePlan =
      subscription.plan.code === FREE_PLAN_CODE
        ? subscription.plan
        : await this.plansRepository.findOne({
            where: { code: FREE_PLAN_CODE, isActive: true },
          });
    if (!freePlan) {
      this.throwBlocked(SubscriptionErrorCode.SubscriptionExpired);
    }

    subscription.planId = freePlan.id;
    subscription.plan = freePlan;
    subscription.status = SubscriptionStatus.Active;
    subscription.billingCycle = BillingCycle.Monthly;
    subscription.trialStartsAt = null;
    subscription.trialEndsAt = null;
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = null;
    subscription.gracePeriodEndsAt = null;
    subscription.planAccessEndsAt = null;
    subscription.cancelAtPeriodEnd = false;
    subscription.lockedMonthlyPrice = null;
    subscription.lockedYearlyPrice = null;
    subscription.providerSubscriptionId = null;
    await this.subscriptionsRepository.save(subscription);
  }

  private throwBlocked(code: SubscriptionErrorCode): never {
    throw new ForbiddenException({
      code,
      message: SUBSCRIPTION_MESSAGES[code],
    });
  }
}
