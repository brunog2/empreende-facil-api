import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ChangePlanDto,
  CreateCheckoutDto,
} from '../dto/subscription-actions.dto';
import { SubscriptionsService } from '../services/subscriptions.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  getMine(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getMine(user.id);
  }

  @Get('me/usage')
  getUsage(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getUsage(user.id);
  }

  @Get('me/payments')
  getPayments(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getPayments(user.id);
  }

  @Post('checkout')
  checkout(
    @CurrentUser() user: { id: string },
    @Body() data: CreateCheckoutDto,
  ) {
    return this.subscriptionsService.checkout(user.id, data);
  }

  @Post('change-plan')
  changePlan(
    @CurrentUser() user: { id: string },
    @Body() data: ChangePlanDto,
  ) {
    return this.subscriptionsService.changePlan(user.id, data);
  }

  @Post('cancel')
  cancel(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.cancel(user.id);
  }

  @Post('reactivate')
  reactivate(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.reactivate(user.id);
  }
}
