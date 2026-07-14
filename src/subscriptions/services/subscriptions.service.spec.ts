import { EntityManager, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/user-access.constants';
import { BillingCycle, SubscriptionStatus } from '../constants/subscription.constants';
import { Payment } from '../entities/payment.entity';
import { Plan } from '../entities/plan.entity';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  const subscriptionsRepository = {
    save: jest.fn(async (value: Subscription) => value),
  } as unknown as Repository<Subscription>;
  const access = { getCurrentOrThrow: jest.fn() };
  const service = new SubscriptionsService(
    subscriptionsRepository,
    {} as Repository<Payment>,
    {} as Repository<User>,
    {} as never,
    access as never,
    {} as never,
    { get: jest.fn() } as never,
    { get: jest.fn() } as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('cria assinatura de teste ao cadastrar cliente', async () => {
    const plan = { id: 'trial-plan', trialDays: 14 } as Plan;
    const subscriptionRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === Plan
          ? { findOne: jest.fn().mockResolvedValue(plan) }
          : subscriptionRepository,
      ),
    } as unknown as EntityManager;
    const user = { id: 'user-id', role: UserRole.Customer } as User;

    const result = await service.createTrialForUser(user, manager);
    expect(result).toMatchObject({
      userId: 'user-id',
      planId: 'trial-plan',
      status: SubscriptionStatus.Trialing,
    });
  });

  it('marca cancelamento apenas para o fim do período', async () => {
    const subscription = {
      id: 'subscription-id',
      status: SubscriptionStatus.Active,
      billingCycle: BillingCycle.Monthly,
      cancelAtPeriodEnd: false,
      providerSubscriptionId: null,
      provider: null,
      plan: {},
    } as Subscription;
    access.getCurrentOrThrow.mockResolvedValue(subscription);
    const result = await service.cancel('user-id');
    expect(result.cancelAtPeriodEnd).toBe(true);
    expect(subscription.status).toBe(SubscriptionStatus.Active);
  });

  it('reativa cancelamento antes do fim do período', async () => {
    const subscription = {
      id: 'subscription-id',
      status: SubscriptionStatus.Active,
      billingCycle: BillingCycle.Monthly,
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
      currentPeriodEnd: new Date(Date.now() + 86_400_000),
      trialEndsAt: null,
      providerSubscriptionId: null,
      provider: null,
      plan: {},
    } as Subscription;
    access.getCurrentOrThrow.mockResolvedValue(subscription);
    const result = await service.reactivate('user-id');
    expect(result.cancelAtPeriodEnd).toBe(false);
    expect(result.canceledAt).toBeNull();
  });
});
