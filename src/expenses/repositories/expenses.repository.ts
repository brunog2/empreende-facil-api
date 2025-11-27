import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { Expense } from '../entities/expense.entity';

@Injectable()
export class ExpensesRepository {
  constructor(
    @InjectRepository(Expense)
    private repository: Repository<Expense>,
  ) {}

  async findAll(userId: string): Promise<Expense[]> {
    return this.repository.find({
      where: { userId },
      order: { expenseDate: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<Expense | null> {
    return this.repository.findOne({
      where: { id, userId },
    });
  }

  async create(data: {
    userId: string;
    description: string;
    amount: number;
    category: string;
    expenseDate?: Date;
    isRecurring?: boolean;
    recurrencePeriod?: string | null;
  }): Promise<Expense> {
    const expense = this.repository.create({
      userId: data.userId,
      description: data.description.trim(),
      amount: data.amount,
      category: data.category.trim(),
      expenseDate: data.expenseDate || new Date(),
      isRecurring: data.isRecurring || false,
      recurrencePeriod: data.recurrencePeriod || null,
    });
    return this.repository.save(expense);
  }

  async update(
    id: string,
    userId: string,
    data: {
      description?: string;
      amount?: number;
      category?: string;
      expenseDate?: Date;
      isRecurring?: boolean;
      recurrencePeriod?: string | null;
    },
  ): Promise<Expense> {
    const expense = await this.findById(id, userId);
    if (!expense) {
      throw new Error('Despesa não encontrada');
    }

    if (data.description !== undefined) expense.description = data.description.trim();
    if (data.amount !== undefined) expense.amount = data.amount;
    if (data.category !== undefined) expense.category = data.category.trim();
    if (data.expenseDate !== undefined) expense.expenseDate = data.expenseDate;
    if (data.isRecurring !== undefined) expense.isRecurring = data.isRecurring;
    if (data.recurrencePeriod !== undefined) expense.recurrencePeriod = data.recurrencePeriod;

    return this.repository.save(expense);
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.repository.delete({ id, userId });
    if (result.affected === 0) {
      throw new Error('Despesa não encontrada');
    }
  }

  async bulkDelete(ids: string[], userId: string): Promise<void> {
    // Verificar se todas as despesas pertencem ao usuário
    const expenses = await this.repository.find({
      where: { id: In(ids), userId },
    });

    if (expenses.length !== ids.length) {
      throw new Error('Algumas despesas não foram encontradas ou não pertencem ao usuário');
    }

    await this.repository.delete({
      id: In(ids),
      userId,
    });
  }

  async findByCategory(userId: string, category: string): Promise<Expense[]> {
    return this.repository.find({
      where: { userId, category },
      order: { expenseDate: 'DESC' },
    });
  }

  async findRecurring(userId: string): Promise<Expense[]> {
    return this.repository.find({
      where: { userId, isRecurring: true },
      order: { expenseDate: 'DESC' },
    });
  }

  async getMonthlyTotal(userId: string, year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await this.repository.find({
      where: {
        userId,
        expenseDate: Between(startDate, endDate),
      },
    });

    return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  }
}


