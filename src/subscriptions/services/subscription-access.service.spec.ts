import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  BillingCycle,
  PlanFeature,
  SubscriptionStatus,
} from '../constants/subscription.constants';
import { Plan } from '../entities/plan.entity';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionAccessService } from './subscription-access.service';

const features = Object.values(PlanFeature).reduce(
  (result, feature) => ({ ...result, [feature]: true }),
  {},
) as Plan['features'];

function makeSubscription(
  status: SubscriptionStatus,
  overrides: Partial<Subscription> = {},
): Subscription {
  return {
    id: 'subscription-id',
    userId: 'user-id',
    planId: 'plan-id',
    status,
    billingCycle: BillingCycle.Monthly,
    trialStartsAt: new Date(),
    trialEndsAt: new Date(Date.now() + 86_400_000),
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 86_400_000),
    gracePeriodEndsAt: null,
    canceledAt: null,
    cancelAtPeriodEnd: false,
    planAccessEndsAt: null,
    lockedMonthlyPrice: null,
    lockedYearlyPrice: null,
    provider: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    plan: { id: 'plan-id', features } as Plan,
    user: null,
    payments: [],
    ...overrides,
  };
}

describe('SubscriptionAccessService', () => {
  const repository = {
    findOne: jest.fn(),
    save: jest.fn(async (value: Subscription) => value),
  } as unknown as jest.Mocked<Repository<Subscription>>;
  const service = new SubscriptionAccessService(repository);

  beforeEach(() => jest.clearAllMocks());

  it('permite uma assinatura ativa dentro do período', async () => {
    await expect(
      service.assertValidStatus(makeSubscription(SubscriptionStatus.Active)),
    ).resolves.toBeUndefined();
  });

  it('permite um teste válido', async () => {
    await expect(
      service.assertValidStatus(makeSubscription(SubscriptionStatus.Trialing)),
    ).resolves.toBeUndefined();
  });

  it('expira um teste encerrado', async () => {
    const subscription = makeSubscription(SubscriptionStatus.Trialing, {
      trialEndsAt: new Date(Date.now() - 1_000),
    });
    await expect(service.assertValidStatus(subscription)).rejects.toMatchObject({
      response: { code: 'SUBSCRIPTION_EXPIRED' },
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: SubscriptionStatus.Expired }),
    );
  });

  it('expira uma condição promocional encerrada', async () => {
    const subscription = makeSubscription(SubscriptionStatus.Active, {
      planAccessEndsAt: new Date(Date.now() - 1_000),
    });
    await expect(service.assertValidStatus(subscription)).rejects.toMatchObject({
      response: { code: 'SUBSCRIPTION_EXPIRED' },
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: SubscriptionStatus.Expired }),
    );
  });

  it('finaliza o cancelamento ao encerrar o período contratado', async () => {
    const subscription = makeSubscription(SubscriptionStatus.Active, {
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(Date.now() - 1_000),
    });
    await expect(service.assertValidStatus(subscription)).rejects.toMatchObject({
      response: { code: 'SUBSCRIPTION_EXPIRED' },
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: SubscriptionStatus.Canceled }),
    );
  });

  it('bloqueia uma assinatura suspensa', async () => {
    await expect(
      service.assertValidStatus(makeSubscription(SubscriptionStatus.Suspended)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permite inadimplência dentro do período de tolerância', async () => {
    const subscription = makeSubscription(SubscriptionStatus.PastDue, {
      gracePeriodEndsAt: new Date(Date.now() + 86_400_000),
    });
    await expect(service.assertValidStatus(subscription)).resolves.toBeUndefined();
  });

  it('suspende após o período de tolerância', async () => {
    const subscription = makeSubscription(SubscriptionStatus.PastDue, {
      gracePeriodEndsAt: new Date(Date.now() - 1_000),
    });
    await expect(service.assertValidStatus(subscription)).rejects.toMatchObject({
      response: { code: 'SUBSCRIPTION_SUSPENDED' },
    });
  });

  it('bloqueia recurso não incluído no plano', async () => {
    const subscription = makeSubscription(SubscriptionStatus.Active);
    subscription.plan.features.expenses = false;
    repository.findOne.mockResolvedValue(subscription);
    await expect(
      service.assertAccess('user-id', PlanFeature.Expenses),
    ).rejects.toMatchObject({ response: { code: 'FEATURE_NOT_INCLUDED' } });
  });
});
