import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { User } from '../users/entities/user.entity';
import { AdminPaymentsController } from './controllers/admin-payments.controller';
import { AdminPlansController } from './controllers/admin-plans.controller';
import { AdminSubscriptionsController } from './controllers/admin-subscriptions.controller';
import { PaymentWebhooksController } from './controllers/payment-webhooks.controller';
import { PlansController } from './controllers/plans.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { PaymentWebhookEvent } from './entities/payment-webhook-event.entity';
import { Payment } from './entities/payment.entity';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionGuard } from './guards/subscription.guard';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import { AdminSubscriptionsService } from './services/admin-subscriptions.service';
import { PaymentWebhookService } from './services/payment-webhook.service';
import { PlanLimitService } from './services/plan-limit.service';
import { PlansService } from './services/plans.service';
import { SubscriptionAccessService } from './services/subscription-access.service';
import { SubscriptionJobsService } from './services/subscription-jobs.service';
import { SubscriptionsService } from './services/subscriptions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      Subscription,
      Payment,
      PaymentWebhookEvent,
      User,
      Product,
      Customer,
      Sale,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [
    PlansController,
    SubscriptionsController,
    AdminSubscriptionsController,
    AdminPlansController,
    AdminPaymentsController,
    PaymentWebhooksController,
  ],
  providers: [
    PlansService,
    SubscriptionAccessService,
    PlanLimitService,
    SubscriptionsService,
    AdminSubscriptionsService,
    PaymentWebhookService,
    SubscriptionJobsService,
    SubscriptionGuard,
    MockPaymentProvider,
    PaymentProviderRegistry,
  ],
  exports: [
    PlansService,
    SubscriptionAccessService,
    PlanLimitService,
    SubscriptionsService,
    SubscriptionGuard,
  ],
})
export class SubscriptionsModule {}
