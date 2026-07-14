import {
  BillingCycle,
  PaymentStatus,
} from '../constants/subscription.constants';

export interface CreateCustomerInput {
  userId: string;
  name: string;
  email: string;
}

export interface ProviderCustomer {
  id: string;
}

export interface CreateCheckoutInput {
  paymentId: string;
  customerId: string;
  planCode: string;
  billingCycle: BillingCycle;
  amount: string;
  description: string;
}

export interface CheckoutResult {
  providerPaymentId: string;
  providerSubscriptionId?: string;
  checkoutUrl: string | null;
  status: PaymentStatus;
}

export interface WebhookResult {
  eventId: string;
  providerPaymentId: string;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  failedAt?: Date;
  providerSubscriptionId?: string;
}

export interface PaymentProvider {
  readonly name: string;
  createCustomer(data: CreateCustomerInput): Promise<ProviderCustomer>;
  createCheckout(data: CreateCheckoutInput): Promise<CheckoutResult>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
  reactivateSubscription(providerSubscriptionId: string): Promise<void>;
  handleWebhook(
    payload: unknown,
    signature?: string,
    rawBody?: Buffer,
  ): Promise<WebhookResult>;
}
