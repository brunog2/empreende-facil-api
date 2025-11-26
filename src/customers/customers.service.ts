import { Injectable, BadRequestException } from '@nestjs/common';
import { CustomersRepository } from './repositories/customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private repository: CustomersRepository) {}

  async getAllCustomers(userId: string) {
    return this.repository.findAll(userId);
  }

  async getCustomerById(id: string, userId: string) {
    return this.repository.findById(id, userId);
  }

  async createCustomer(userId: string, data: CreateCustomerDto) {
    // Validações de negócio
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException('O nome do cliente é obrigatório');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new BadRequestException('Email inválido');
    }

    return this.repository.create({
      userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
    });
  }

  async updateCustomer(id: string, userId: string, data: UpdateCustomerDto) {
    // Validações de negócio
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      throw new BadRequestException('O nome do cliente é obrigatório');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new BadRequestException('Email inválido');
    }

    return this.repository.update(id, userId, data);
  }

  async deleteCustomer(id: string, userId: string) {
    return this.repository.delete(id, userId);
  }

  async searchCustomers(userId: string, query: string) {
    return this.repository.search(userId, query);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}


