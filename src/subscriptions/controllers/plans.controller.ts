import { Controller, Get, Param } from '@nestjs/common';
import { PlansService } from '../services/plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  findAll() {
    return this.plansService.findActive();
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.plansService.findActiveByCode(code);
  }
}
