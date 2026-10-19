import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { BulkDeleteDto } from '../common/dto/bulk-delete.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { UserPermission } from '../users/user-access.constants';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { RequireFeature } from '../subscriptions/decorators/require-feature.decorator';
import { PlanFeature } from '../subscriptions/constants/subscription.constants';

@Controller('expenses')
@RequirePermission(UserPermission.Expenses)
@RequireFeature(PlanFeature.Expenses)
@UseGuards(JwtAuthGuard, PermissionGuard, SubscriptionGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.expensesService.getAllExpenses(user.id);
  }

  @Get('by-category')
  findByCategory(
    @CurrentUser() user: { id: string },
    @Query('category') category: string,
  ) {
    return this.expensesService.getExpensesByCategory(user.id, category);
  }

  @Get('recurring')
  findRecurring(@CurrentUser() user: { id: string }) {
    return this.expensesService.getRecurringExpenses(user.id);
  }

  @Get('monthly-total')
  getMonthlyTotal(
    @CurrentUser() user: { id: string },
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.expensesService.getMonthlyTotal(
      user.id,
      parseInt(year),
      parseInt(month),
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.expensesService.getExpenseById(id, user.id);
  }

  @Post()
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.expensesService.createExpense(user.id, createExpenseDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.expensesService.updateExpense(id, user.id, updateExpenseDto);
  }

  @Delete('bulk')
  bulkDelete(
    @Body() bulkDeleteDto: BulkDeleteDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.expensesService.bulkDeleteExpenses(bulkDeleteDto.ids, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.expensesService.deleteExpense(id, user.id);
  }
}
