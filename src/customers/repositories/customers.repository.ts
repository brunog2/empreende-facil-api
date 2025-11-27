import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Or, In } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { FilterCustomersDto } from '../dto/filter-customers.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

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

  async findWithFilters(
    userId: string,
    filters: FilterCustomersDto,
  ): Promise<PaginatedResponse<Customer>> {
    const { page = 1, limit = 10, search } = filters;

    const queryBuilder = this.repository.createQueryBuilder('customer');

    queryBuilder.where('customer.userId = :userId', { userId });

    // Filtro de busca (nome, email, telefone ou endereço)
    if (search) {
      queryBuilder.andWhere(
        '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search OR customer.address ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Ordenação
    queryBuilder.orderBy('customer.name', 'ASC');

    // Paginação
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Contar total
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  async bulkDelete(ids: string[], userId: string): Promise<void> {
    // Verificar se todos os clientes pertencem ao usuário
    const customers = await this.repository.find({
      where: { id: In(ids), userId },
    });

    if (customers.length !== ids.length) {
      throw new Error('Alguns clientes não foram encontrados ou não pertencem ao usuário');
    }

    await this.repository.delete({
      id: In(ids),
      userId,
    });
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


