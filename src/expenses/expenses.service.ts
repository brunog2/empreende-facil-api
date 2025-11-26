import { Injectable, BadRequestException } from '@nestjs/common';
import { ExpensesRepository } from './repositories/expenses.repository';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private repository: ExpensesRepository) {}

  async getAllExpenses(userId: string) {
    return this.repository.findAll(userId);
  }

  async getExpenseById(id: string, userId: string) {
    return this.repository.findById(id, userId);
  }

  async createExpense(userId: string, data: CreateExpenseDto) {
    if (data.amount <= 0) {
      throw new BadRequestException('O valor da despesa deve ser maior que zero');
    }

    if (data.isRecurring && !data.recurrencePeriod) {
      throw new BadRequestException('Período de recorrência é obrigatório para despesas recorrentes');
    }

    return this.repository.create({
      userId,
      description: data.description,
      amount: data.amount,
      category: data.category,
      expenseDate: data.expenseDate,
      isRecurring: data.isRecurring,
      recurrencePeriod: data.recurrencePeriod,
    });
  }

  async updateExpense(id: string, userId: string, data: UpdateExpenseDto) {
    if (data.amount !== undefined && data.amount <= 0) {
      throw new BadRequestException('O valor da despesa deve ser maior que zero');
    }

    if (data.isRecurring && !data.recurrencePeriod) {
      throw new BadRequestException('Período de recorrência é obrigatório para despesas recorrentes');
    }

    return this.repository.update(id, userId, data);
  }

  async deleteExpense(id: string, userId: string) {
    return this.repository.delete(id, userId);
  }

  async getExpensesByCategory(userId: string, category: string) {
    return this.repository.findByCategory(userId, category);
  }

  async getRecurringExpenses(userId: string) {
    return this.repository.findRecurring(userId);
  }

  async getMonthlyTotal(userId: string, year: number, month: number) {
    return this.repository.getMonthlyTotal(userId, year, month);
  }
}


