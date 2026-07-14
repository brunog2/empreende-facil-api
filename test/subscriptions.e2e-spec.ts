import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AdminGuard } from '../src/auth/guards/admin.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { AdminSubscriptionsController } from '../src/subscriptions/controllers/admin-subscriptions.controller';
import { PlansController } from '../src/subscriptions/controllers/plans.controller';
import { SubscriptionsController } from '../src/subscriptions/controllers/subscriptions.controller';
import { BillingCycle } from '../src/subscriptions/constants/subscription.constants';
import { AdminSubscriptionsService } from '../src/subscriptions/services/admin-subscriptions.service';
import { PlansService } from '../src/subscriptions/services/plans.service';
import { SubscriptionsService } from '../src/subscriptions/services/subscriptions.service';

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest().user = { id: 'user-id', role: 'admin' };
    return true;
  }
}

describe('Subscription endpoints (e2e)', () => {
  let app: INestApplication;
  const plansService = {
    findActive: jest.fn().mockResolvedValue([{ code: 'trial', isActive: true }]),
    findActiveByCode: jest.fn().mockResolvedValue({ code: 'trial', isActive: true }),
  };
  const subscriptionsService = {
    getMine: jest.fn().mockResolvedValue({ id: 'subscription-id', status: 'trialing' }),
    getUsage: jest.fn().mockResolvedValue({ products: { current: 0, limit: 30 } }),
    getPayments: jest.fn().mockResolvedValue([]),
    checkout: jest.fn().mockResolvedValue({ code: 'PAYMENT_CONFIRMATION_PENDING' }),
    changePlan: jest.fn(),
    cancel: jest.fn(),
    reactivate: jest.fn(),
  };
  const adminService = {
    findAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    getMetrics: jest.fn().mockResolvedValue({ total: 0, estimatedMrr: '0.00' }),
    findOne: jest.fn(),
    update: jest.fn(),
    extendTrial: jest.fn(),
    changePlan: jest.fn(),
    suspend: jest.fn(),
    reactivate: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [PlansController, SubscriptionsController, AdminSubscriptionsController],
      providers: [
        { provide: PlansService, useValue: plansService },
        { provide: SubscriptionsService, useValue: subscriptionsService },
        { provide: AdminSubscriptionsService, useValue: adminService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .overrideGuard(AdminGuard)
      .useClass(TestAuthGuard)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /api/plans retorna apenas a coleção do service público', async () => {
    await request(app.getHttpServer()).get('/api/plans').expect(200).expect([{ code: 'trial', isActive: true }]);
  });

  it('GET /api/subscriptions/me mantém o escopo do usuário autenticado', async () => {
    await request(app.getHttpServer()).get('/api/subscriptions/me').expect(200).expect({ id: 'subscription-id', status: 'trialing' });
    expect(subscriptionsService.getMine).toHaveBeenCalledWith('user-id');
  });

  it('POST /api/subscriptions/checkout não confirma pagamento localmente', async () => {
    await request(app.getHttpServer())
      .post('/api/subscriptions/checkout')
      .send({ planCode: 'starter', billingCycle: BillingCycle.Monthly })
      .expect(201)
      .expect({ code: 'PAYMENT_CONFIRMATION_PENDING' });
  });

  it('GET /api/admin/subscriptions/metrics expõe métricas protegidas', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/subscriptions/metrics')
      .expect(200)
      .expect({ total: 0, estimatedMrr: '0.00' });
  });
});
