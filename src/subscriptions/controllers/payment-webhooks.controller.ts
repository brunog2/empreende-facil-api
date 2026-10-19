import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentWebhookService } from '../services/payment-webhook.service';

@Controller('webhooks/payments')
export class PaymentWebhooksController {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  @Post(':provider')
  process(
    @Param('provider') provider: string,
    @Body() payload: unknown,
    @Headers('x-payment-signature') signature: string | undefined,
    @Req() request: RawBodyRequest<Request>,
  ) {
    return this.webhookService.process(
      provider,
      payload,
      signature,
      request.rawBody,
    );
  }
}
