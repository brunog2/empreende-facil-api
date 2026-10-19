import { Injectable, NotFoundException } from '@nestjs/common';
import { MockPaymentProvider } from './mock-payment.provider';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class PaymentProviderRegistry {
  private readonly providers: Map<string, PaymentProvider>;

  constructor(mockProvider: MockPaymentProvider) {
    this.providers = new Map([[mockProvider.name, mockProvider]]);
  }

  get(providerName: string): PaymentProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new NotFoundException(`Provedor de pagamento não configurado: ${providerName}`);
    }
    return provider;
  }
}
