import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Or } from 'typeorm';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomersRepository {
  constructor(
    @InjectRepository(Customer)
    private repository: Repository<Customer>,
  ) {}

  async findAll(userId: string): Promise<Customer[]> {
    return this.repository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string, userId: string): Promise<Customer | null> {
    return this.repository.findOne({
      where: { id, userId },
    });
  }

  async create(data: {
    userId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
  }): Promise<Customer> {
    const customer = this.repository.create({
      userId: data.userId,
      name: data.name.trim(),
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
    });
    return this.repository.save(customer);
  }

  async update(
    id: string,
    userId: string,
    data: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      notes?: string | null;
    },
  ): Promise<Customer> {
    const customer = await this.findById(id, userId);
    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    if (data.name !== undefined) customer.name = data.name.trim();
    if (data.email !== undefined) customer.email = data.email;
    if (data.phone !== undefined) customer.phone = data.phone;
    if (data.address !== undefined) customer.address = data.address;
    if (data.notes !== undefined) customer.notes = data.notes;

    return this.repository.save(customer);
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.repository.delete({ id, userId });
    if (result.affected === 0) {
      throw new Error('Cliente não encontrado');
    }
  }

  async search(userId: string, query: string): Promise<Customer[]> {
    return this.repository.find({
      where: [
        { userId, name: Like(`%${query}%`) },
        { userId, email: Like(`%${query}%`) },
        { userId, phone: Like(`%${query}%`) },
      ],
      order: { name: 'ASC' },
    });
  }
}


