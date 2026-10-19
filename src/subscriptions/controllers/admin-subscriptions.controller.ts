import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminSubscriptionFiltersDto } from '../dto/admin-subscription-filters.dto';
import {
  AdminChangePlanDto,
  ExtendTrialDto,
  SuspendSubscriptionDto,
  UpdateSubscriptionDto,
} from '../dto/subscription-actions.dto';
import { AdminSubscriptionsService } from '../services/admin-subscriptions.service';

@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSubscriptionsController {
  constructor(private readonly service: AdminSubscriptionsService) {}

  @Get()
  findAll(@Query() filters: AdminSubscriptionFiltersDto) {
    return this.service.findAll(filters);
  }

  @Get('metrics')
  getMetrics() {
    return this.service.getMetrics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateSubscriptionDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.service.update(id, data, admin.id);
  }

  @Post(':id/extend-trial')
  extendTrial(
    @Param('id') id: string,
    @Body() data: ExtendTrialDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.service.extendTrial(id, data, admin.id);
  }

  @Post(':id/change-plan')
  changePlan(
    @Param('id') id: string,
    @Body() data: AdminChangePlanDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.service.changePlan(id, data, admin.id);
  }

  @Post(':id/suspend')
  suspend(
    @Param('id') id: string,
    @Body() data: SuspendSubscriptionDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.service.suspend(id, data, admin.id);
  }

  @Post(':id/reactivate')
  reactivate(
    @Param('id') id: string,
    @CurrentUser() admin: { id: string },
  ) {
    return this.service.reactivate(id, admin.id);
  }
}
