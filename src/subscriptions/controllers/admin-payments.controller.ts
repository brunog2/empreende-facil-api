import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminPaymentFiltersDto } from '../dto/admin-subscription-filters.dto';
import { AdminSubscriptionsService } from '../services/admin-subscriptions.service';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPaymentsController {
  constructor(private readonly service: AdminSubscriptionsService) {}

  @Get()
  findAll(@Query() filters: AdminPaymentFiltersDto) {
    return this.service.findPayments(filters);
  }
}
