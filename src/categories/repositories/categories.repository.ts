import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Category } from '../entities/category.entity';
import { FilterCategoriesDto } from '../dto/filter-categories.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectRepository(Category)
    private repository: Repository<Category>,
  ) {}

  async findAll(userId: string): Promise<Category[]> {
    return this.repository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }

  async findWithFilters(
    userId: string,
    filters: FilterCategoriesDto,
  ): Promise<PaginatedResponse<Category>> {
    const { page = 1, limit = 10, search } = filters;

    const queryBuilder = this.repository.createQueryBuilder('category');

    queryBuilder.where('category.userId = :userId', { userId });

    // Filtro de busca (nome ou descrição)
    if (search) {
      queryBuilder.andWhere(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Ordenação
    queryBuilder.orderBy('category.name', 'ASC');

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

  async findById(id: string, userId: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { id, userId },
    });
  }

  async create(data: {
    userId: string;
    name: string;
    description?: string | null;
  }): Promise<Category> {
    const category = this.repository.create({
      userId: data.userId,
      name: data.name.trim(),
      description: data.description || null,
    });
    return this.repository.save(category);
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; description?: string | null },
  ): Promise<Category> {
    const category = await this.findById(id, userId);
    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    if (data.name !== undefined) {
      category.name = data.name.trim();
    }
    if (data.description !== undefined) {
      category.description = data.description;
    }

    return this.repository.save(category);
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.repository.delete({ id, userId });
    if (result.affected === 0) {
      throw new Error('Categoria não encontrada');
    }
  }

  async bulkDelete(ids: string[], userId: string): Promise<void> {
    // Verificar se todas as categorias pertencem ao usuário
    const categories = await this.repository.find({
      where: { id: In(ids), userId },
    });

    if (categories.length !== ids.length) {
      throw new Error('Algumas categorias não foram encontradas ou não pertencem ao usuário');
    }

    await this.repository.delete({
      id: In(ids),
      userId,
    });
  }

  async search(userId: string, query: string): Promise<Category[]> {
    return this.repository.find({
      where: [
        { userId, name: Like(`%${query}%`) },
        { userId, description: Like(`%${query}%`) },
      ],
      order: { name: 'ASC' },
    });
  }
}


