import { ForbiddenException } from "@nestjs/common";
import { Repository } from "typeorm";
import {
  BillingCycle,
  PlanFeature,
  SubscriptionStatus,
} from "../constants/subscription.constants";
import { Plan } from "../entities/plan.entity";
import { Subscription } from "../entities/subscription.entity";
import { SubscriptionAccessService } from "./subscription-access.service";

const features = Object.values(PlanFeature).reduce(
  (result, feature) => ({ ...result, [feature]: true }),
  {},
) as Plan["features"];

function makeSubscription(
  status: SubscriptionStatus,
  overrides: Partial<Subscription> = {},
): Subscription {
  return {
    id: "subscription-id",
    userId: "user-id",
    planId: "plan-id",
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
    plan: { id: "plan-id", code: "starter", features } as Plan,
    user: null,
    payments: [],
    ...overrides,
  };
}

describe("SubscriptionAccessService", () => {
  const repository = {
    findOne: jest.fn(),
    save: jest.fn(async (value: Subscription) => value),
  } as unknown as jest.Mocked<Repository<Subscription>>;
  const freePlan = {
    id: "free-plan-id",
    code: "trial",
    features: { ...features, advancedReports: false },
  } as Plan;
  const plansRepository = {
    findOne: jest.fn().mockResolvedValue(freePlan),
  } as unknown as jest.Mocked<Repository<Plan>>;
  const service = new SubscriptionAccessService(repository, plansRepository);

  beforeEach(() => jest.clearAllMocks());

  it("permite uma assinatura ativa dentro do período", async () => {
    await expect(
      service.assertValidStatus(makeSubscription(SubscriptionStatus.Active)),
    ).resolves.toBeUndefined();
  });

  it("mantém o plano gratuito ativo sem data de expiração", async () => {
    const subscription = makeSubscription(SubscriptionStatus.Active, {
      plan: freePlan,
      planId: freePlan.id,
      trialEndsAt: null,
      currentPeriodEnd: null,
    });

    await expect(
      service.assertValidStatus(subscription),
    ).resolves.toBeUndefined();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("mantém o bloqueio administrativo no plano gratuito suspenso", async () => {
    const subscription = makeSubscription(SubscriptionStatus.Suspended, {
      plan: freePlan,
      planId: freePlan.id,
      trialEndsAt: null,
      currentPeriodEnd: null,
    });

    await expect(service.assertValidStatus(subscription)).rejects.toMatchObject(
      {
        response: { code: "SUBSCRIPTION_SUSPENDED" },
      },
    );
  });

  it("permite um teste válido", async () => {
    await expect(
      service.assertValidStatus(makeSubscription(SubscriptionStatus.Trialing)),
    ).resolves.toBeUndefined();
  });

  it("retorna ao plano gratuito quando um teste legado termina", async () => {
    const subscription = makeSubscription(SubscriptionStatus.Trialing, {
      trialEndsAt: new Date(Date.now() - 1_000),
    });
    await expect(
      service.assertValidStatus(subscription),
    ).resolves.toBeUndefined();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: "free-plan-id",
        status: SubscriptionStatus.Active,
      }),
    );
  });

  it("retorna ao plano gratuito ao encerrar uma condição promocional", async () => {
    const subscription = makeSubscription(SubscriptionStatus.Active, {
      planAccessEndsAt: new Date(Date.now() - 1_000),
    });
    await expect(
      service.assertValidStatus(subscription),
    ).resolves.toBeUndefined();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: "free-plan-id",
        status: SubscriptionStatus.Active,
      }),
    );
  });

  it("retorna ao plano gratuito no fim do período cancelado", async () => {
    const subscription = makeSubscription(SubscriptionStatus.Active, {
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(Date.now() - 1_000),
    });
    await expect(
      service.assertValidStatus(subscription),
    ).resolves.toBeUndefined();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: "free-plan-id",
        status: SubscriptionStatus.Active,
        cancelAtPeriodEnd: false,
      }),
    );
  });

  it("bloqueia uma assinatura suspensa", async () => {
    await expect(
      service.assertValidStatus(makeSubscription(SubscriptionStatus.Suspended)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("permite inadimplência dentro do período de tolerância", async () => {
    const subscription = makeSubscription(SubscriptionStatus.PastDue, {
      gracePeriodEndsAt: new Date(Date.now() + 86_400_000),
    });
    await expect(
      service.assertValidStatus(subscription),
    ).resolves.toBeUndefined();
  });

  it("retorna ao plano gratuito após o período de tolerância", async () => {
    const subscription = makeSubscription(SubscriptionStatus.PastDue, {
      gracePeriodEndsAt: new Date(Date.now() - 1_000),
    });
    await expect(
      service.assertValidStatus(subscription),
    ).resolves.toBeUndefined();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: "free-plan-id",
        status: SubscriptionStatus.Active,
      }),
    );
  });

  it("bloqueia recurso não incluído no plano", async () => {
    const subscription = makeSubscription(SubscriptionStatus.Active);
    subscription.plan.features.expenses = false;
    repository.findOne.mockResolvedValue(subscription);
    await expect(
      service.assertAccess("user-id", PlanFeature.Expenses),
    ).rejects.toMatchObject({ response: { code: "FEATURE_NOT_INCLUDED" } });
  });

  it("permite relatórios avançados e bloqueia exportação separadamente", async () => {
    const subscription = makeSubscription(SubscriptionStatus.Active);
    subscription.plan.features.advancedReports = true;
    subscription.plan.features.dataExport = false;
    repository.findOne.mockResolvedValue(subscription);

    await expect(
      service.assertAccess("user-id", PlanFeature.AdvancedReports),
    ).resolves.toBe(subscription);
    await expect(
      service.assertAccess("user-id", PlanFeature.DataExport),
    ).rejects.toMatchObject({ response: { code: "FEATURE_NOT_INCLUDED" } });
  });
});
