import { Injectable, BadRequestException } from '@nestjs/common';
import { ProductsRepository } from './repositories/products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(private repository: ProductsRepository) {}

  async getAllProducts(userId: string) {
    return this.repository.findAll(userId);
  }

  async getProductsWithFilters(
    userId: string,
    filters: FilterProductsDto,
  ): Promise<PaginatedResponse<Product>> {
    return this.repository.findWithFilters(userId, filters);
  }

  async getProductById(id: string, userId: string) {
    return this.repository.findById(id, userId);
  }

  async createProduct(userId: string, data: CreateProductDto) {
    // Validações de negócio
    if (data.salePrice < data.costPrice) {
      throw new BadRequestException(
        'O preço de venda não pode ser menor que o preço de custo',
      );
    }

    if (data.stockQuantity < 0) {
      throw new BadRequestException(
        'A quantidade em estoque não pode ser negativa',
      );
    }

    return this.repository.create({
      userId,
      name: data.name,
      description: data.description,
      category: data.category,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      stockQuantity: data.stockQuantity,
    });
  }

  async updateProduct(id: string, userId: string, data: UpdateProductDto) {
    const product = await this.repository.findById(id, userId);
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    // Validações de negócio
    const salePrice = data.salePrice ?? product.salePrice;
    const costPrice = data.costPrice ?? product.costPrice;

    if (salePrice < costPrice) {
      throw new BadRequestException(
        'O preço de venda não pode ser menor que o preço de custo',
      );
    }

    if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
      throw new BadRequestException(
        'A quantidade em estoque não pode ser negativa',
      );
    }

    return this.repository.update(id, userId, data);
  }

  async deleteProduct(id: string, userId: string) {
    return this.repository.delete(id, userId);
  }

  async bulkDeleteProducts(ids: string[], userId: string) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('Nenhum produto selecionado para exclusão');
    }
    return this.repository.bulkDelete(ids, userId);
  }

  async getProductsByCategory(userId: string, category: string) {
    return this.repository.findByCategory(userId, category);
  }

  async getLowStockProducts(userId: string) {
    return this.repository.findLowStock(userId);
  }
}


