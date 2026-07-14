import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PaymentStatus } from '../constants/subscription.constants';
import {
  CheckoutResult,
  CreateCheckoutInput,
  CreateCustomerInput,
  PaymentProvider,
  ProviderCustomer,
  WebhookResult,
} from './payment-provider.interface';

interface MockWebhookPayload {
  id: string;
  paymentId: string;
  status: PaymentStatus;
  paidAt?: string;
  failedAt?: string;
  subscriptionId?: string;
}

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  constructor(private readonly configService: ConfigService) {}

  async createCustomer(data: CreateCustomerInput): Promise<ProviderCustomer> {
    return { id: `local_customer_${data.userId}` };
  }

  async createCheckout(
    _data: CreateCheckoutInput,
  ): Promise<CheckoutResult> {
    return {
      providerPaymentId: `local_payment_${randomUUID()}`,
      checkoutUrl: null,
      status: PaymentStatus.Pending,
    };
  }

  async cancelSubscription(_providerSubscriptionId: string): Promise<void> {
    return undefined;
  }

  async reactivateSubscription(
    _providerSubscriptionId: string,
  ): Promise<void> {
    return undefined;
  }

  async handleWebhook(
    payload: unknown,
    signature?: string,
    rawBody?: Buffer,
  ): Promise<WebhookResult> {
    const secret = this.configService.get<string>('MOCK_PAYMENT_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'Webhook local não configurado.',
      });
    }

    if (!signature || !rawBody) {
      throw new UnauthorizedException('Assinatura do webhook ausente.');
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const received = signature.replace(/^sha256=/, '');
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException('Assinatura do webhook inválida.');
    }

    if (!this.isWebhookPayload(payload)) {
      throw new UnauthorizedException('Payload de webhook inválido.');
    }

    return {
      eventId: payload.id,
      providerPaymentId: payload.paymentId,
      paymentStatus: payload.status,
      paidAt: payload.paidAt ? new Date(payload.paidAt) : undefined,
      failedAt: payload.failedAt ? new Date(payload.failedAt) : undefined,
      providerSubscriptionId: payload.subscriptionId,
    };
  }

  private isWebhookPayload(payload: unknown): payload is MockWebhookPayload {
    if (!payload || typeof payload !== 'object') return false;
    const candidate = payload as Record<string, unknown>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.paymentId === 'string' &&
      Object.values(PaymentStatus).includes(candidate.status as PaymentStatus)
    );
  }
}
