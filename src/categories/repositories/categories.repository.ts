import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Category } from '../entities/category.entity';

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


