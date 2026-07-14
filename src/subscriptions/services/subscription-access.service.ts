import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlanFeature,
  SubscriptionStatus,
} from '../constants/subscription.constants';
import {
  FEATURE_LABELS,
  SUBSCRIPTION_MESSAGES,
  SubscriptionErrorCode,
} from '../constants/subscription-errors.constants';
import { Subscription } from '../entities/subscription.entity';

@Injectable()
export class SubscriptionAccessService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
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

  async assertAccess(userId: string, feature?: PlanFeature): Promise<Subscription> {
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

  async assertValidStatus(subscription: Subscription, now = new Date()): Promise<void> {
    if (subscription.status === SubscriptionStatus.Trialing) {
      if (!subscription.trialEndsAt || subscription.trialEndsAt <= now) {
        await this.updateStatus(subscription, SubscriptionStatus.Expired);
        this.throwBlocked(SubscriptionErrorCode.SubscriptionExpired);
      }
      return;
    }

    if (subscription.status === SubscriptionStatus.Active) {
      if (subscription.currentPeriodEnd && subscription.currentPeriodEnd <= now) {
        const status = subscription.cancelAtPeriodEnd
          ? SubscriptionStatus.Canceled
          : SubscriptionStatus.Expired;
        await this.updateStatus(subscription, status);
        this.throwBlocked(SubscriptionErrorCode.SubscriptionExpired);
      }
      return;
    }

    if (subscription.status === SubscriptionStatus.PastDue) {
      if (subscription.gracePeriodEndsAt && subscription.gracePeriodEndsAt > now) {
        return;
      }
      await this.updateStatus(subscription, SubscriptionStatus.Suspended);
      this.throwBlocked(SubscriptionErrorCode.SubscriptionSuspended);
    }

    if (subscription.status === SubscriptionStatus.Suspended) {
      this.throwBlocked(SubscriptionErrorCode.SubscriptionSuspended);
    }

    this.throwBlocked(SubscriptionErrorCode.SubscriptionExpired);
  }

  private async updateStatus(
    subscription: Subscription,
    status: SubscriptionStatus,
  ): Promise<void> {
    if (subscription.status === status) return;
    subscription.status = status;
    await this.subscriptionsRepository.save(subscription);
  }

  private throwBlocked(code: SubscriptionErrorCode): never {
    throw new ForbiddenException({
      code,
      message: SUBSCRIPTION_MESSAGES[code],
    });
  }
}
