import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';
import { PlansService } from '../services/plans.service';

@Controller('admin/plans')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  findAll() {
    return this.plansService.findAllAdmin();
  }

  @Post()
  create(@Body() data: CreatePlanDto) {
    return this.plansService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdatePlanDto) {
    return this.plansService.update(id, data);
  }
}
