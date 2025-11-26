import { Injectable, ConflictException } from '@nestjs/common';
import { CategoriesRepository } from './repositories/categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private repository: CategoriesRepository) {}

  async getAllCategories(userId: string) {
    return this.repository.findAll(userId);
  }

  async getCategoryById(id: string, userId: string) {
    return this.repository.findById(id, userId);
  }

  async createCategory(userId: string, data: CreateCategoryDto) {
    // Verificar se já existe categoria com mesmo nome
    const existing = await this.repository.search(userId, data.name.trim());
    const exactMatch = existing.find(
      (cat) => cat.name.toLowerCase() === data.name.trim().toLowerCase(),
    );

    if (exactMatch) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }

    return this.repository.create({
      userId,
      name: data.name,
      description: data.description,
    });
  }

  async updateCategory(
    id: string,
    userId: string,
    data: UpdateCategoryDto,
  ) {
    if (data.name !== undefined) {
      // Verificar se já existe outra categoria com mesmo nome
      const existing = await this.repository.search(userId, data.name.trim());
      const exactMatch = existing.find(
        (cat) => cat.id !== id && cat.name.toLowerCase() === data.name.trim().toLowerCase(),
      );

      if (exactMatch) {
        throw new ConflictException('Já existe uma categoria com este nome');
      }
    }

    return this.repository.update(id, userId, data);
  }

  async deleteCategory(id: string, userId: string) {
    return this.repository.delete(id, userId);
  }

  async searchCategories(userId: string, query: string) {
    return this.repository.search(userId, query);
  }
}


