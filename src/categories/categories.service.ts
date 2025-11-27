import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { CategoriesRepository } from './repositories/categories.repository';
import { ProductsRepository } from '../products/repositories/products.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterCategoriesDto } from './dto/filter-categories.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    private repository: CategoriesRepository,
    private productsRepository: ProductsRepository,
  ) {}

  async getAllCategories(userId: string) {
    return this.repository.findAll(userId);
  }

  async getCategoriesWithFilters(
    userId: string,
    filters: FilterCategoriesDto,
  ): Promise<PaginatedResponse<Category>> {
    return this.repository.findWithFilters(userId, filters);
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
    // Remover categoria de produtos que a utilizam
    const products = await this.productsRepository.findByCategory(userId, id);
    for (const product of products) {
      await this.productsRepository.update(product.id, userId, {
        category: null,
      });
    }

    return this.repository.delete(id, userId);
  }

  async bulkDeleteCategories(ids: string[], userId: string) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('Nenhuma categoria selecionada para exclusão');
    }

    // Remover categorias de produtos que as utilizam
    for (const categoryId of ids) {
      const products = await this.productsRepository.findByCategory(userId, categoryId);
      for (const product of products) {
        await this.productsRepository.update(product.id, userId, {
          category: null,
        });
      }
    }

    return this.repository.bulkDelete(ids, userId);
  }

  async searchCategories(userId: string, query: string) {
    return this.repository.search(userId, query);
  }
}


