import { createHash } from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import {
  BillingCycle,
  PaymentStatus,
  SubscriptionStatus,
  WebhookProcessingStatus,
} from '../constants/subscription.constants';
import { PaymentWebhookEvent } from '../entities/payment-webhook-event.entity';
import { Payment } from '../entities/payment.entity';
import { Plan } from '../entities/plan.entity';
import { Subscription } from '../entities/subscription.entity';
import { PaymentProviderRegistry } from '../providers/payment-provider.registry';

interface PaymentMetadata {
  targetPlanId?: string;
  targetPlanCode?: string;
  billingCycle?: BillingCycle;
}

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    @InjectRepository(PaymentWebhookEvent)
    private readonly eventsRepository: Repository<PaymentWebhookEvent>,
    private readonly providerRegistry: PaymentProviderRegistry,
    private readonly dataSource: DataSource,
  ) {}

  async process(
    providerName: string,
    payload: unknown,
    signature: string | undefined,
    rawBody: Buffer | undefined,
  ) {
    const provider = this.providerRegistry.get(providerName);
    const result = await provider.handleWebhook(payload, signature, rawBody);
    const existing = await this.eventsRepository.findOne({
      where: { provider: providerName, eventId: result.eventId },
    });
    if (existing?.status === WebhookProcessingStatus.Processed) {
      return { processed: true, duplicate: true };
    }

    let event = existing;
    if (!event) {
      try {
        event = await this.eventsRepository.save(
          this.eventsRepository.create({
            provider: providerName,
            eventId: result.eventId,
            payloadHash: createHash('sha256')
              .update(rawBody ?? Buffer.from(JSON.stringify(payload)))
              .digest('hex'),
            status: WebhookProcessingStatus.Processing,
            processedAt: null,
            error: null,
          }),
        );
      } catch (error) {
        if (error instanceof QueryFailedError) {
          return { processed: true, duplicate: true };
        }
        throw error;
      }
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const paymentRepository = manager.getRepository(Payment);
        const subscriptionRepository = manager.getRepository(Subscription);
        const eventRepository = manager.getRepository(PaymentWebhookEvent);
        const payment = await paymentRepository.findOne({
          where: {
            provider: providerName,
            providerPaymentId: result.providerPaymentId,
          },
        });
        if (!payment) throw new NotFoundException('Pagamento não encontrado.');

        payment.status = result.paymentStatus;
        payment.paidAt = result.paidAt ?? payment.paidAt;
        payment.failedAt = result.failedAt ?? payment.failedAt;
        await paymentRepository.save(payment);

        const subscription = await subscriptionRepository.findOne({
          where: { id: payment.subscriptionId },
        });
        if (!subscription) throw new NotFoundException('Assinatura não encontrada.');

        if (result.paymentStatus === PaymentStatus.Paid) {
          const metadata = (payment.metadata ?? {}) as PaymentMetadata;
          if (metadata.targetPlanId) {
            const targetPlan = await manager.getRepository(Plan).findOne({
              where: { id: metadata.targetPlanId },
            });
            if (!targetPlan) throw new NotFoundException('Plano não encontrado.');
            subscription.planId = targetPlan.id;
            if (targetPlan.code === 'founder') {
              subscription.lockedMonthlyPrice = targetPlan.monthlyPrice;
              subscription.lockedYearlyPrice = targetPlan.yearlyPrice;
            } else {
              subscription.lockedMonthlyPrice = null;
              subscription.lockedYearlyPrice = null;
            }
          }
          if (metadata.billingCycle) subscription.billingCycle = metadata.billingCycle;
          const now = result.paidAt ?? new Date();
          subscription.status = SubscriptionStatus.Active;
          subscription.currentPeriodStart = now;
          subscription.currentPeriodEnd = this.addBillingPeriod(
            now,
            subscription.billingCycle,
          );
          subscription.trialEndsAt = subscription.trialEndsAt ?? now;
          subscription.gracePeriodEndsAt = null;
          subscription.cancelAtPeriodEnd = false;
          subscription.canceledAt = null;
          subscription.provider = providerName;
          subscription.providerSubscriptionId =
            result.providerSubscriptionId ?? subscription.providerSubscriptionId;
        } else if (result.paymentStatus === PaymentStatus.Failed) {
          subscription.status = SubscriptionStatus.PastDue;
          const graceEnd = new Date();
          graceEnd.setDate(graceEnd.getDate() + 7);
          subscription.gracePeriodEndsAt = graceEnd;
        }
        await subscriptionRepository.save(subscription);

        event.status = WebhookProcessingStatus.Processed;
        event.processedAt = new Date();
        event.error = null;
        await eventRepository.save(event);
      });
      return { processed: true, duplicate: false };
    } catch (error) {
      event.status = WebhookProcessingStatus.Failed;
      event.error = error instanceof Error ? error.message.slice(0, 1000) : 'Erro desconhecido';
      await this.eventsRepository.save(event);
      this.logger.error(
        JSON.stringify({ provider: providerName, eventId: result.eventId, error: event.error }),
      );
      throw error;
    }
  }

  private addBillingPeriod(date: Date, cycle: BillingCycle): Date {
    const result = new Date(date);
    if (cycle === BillingCycle.Yearly) result.setFullYear(result.getFullYear() + 1);
    else result.setMonth(result.getMonth() + 1);
    return result;
  }
}
