import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between, LessThanOrEqual } from 'typeorm';
import { Product } from '../entities/product.entity';
import { FilterProductsDto } from '../dto/filter-products.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private repository: Repository<Product>,
  ) {}

  async findAll(userId: string): Promise<Product[]> {
    return this.repository.find({
      where: { userId },
      order: { name: 'ASC' },
      withDeleted: false,
    });
  }

  async findWithFilters(
    userId: string,
    filters: FilterProductsDto,
  ): Promise<PaginatedResponse<Product>> {
    const {
      page = 1,
      limit = 10,
      search,
      categories,
      lowStock,
      minSalePrice,
      maxSalePrice,
      minCostPrice,
      maxCostPrice,
    } = filters;

    const queryBuilder = this.repository.createQueryBuilder('product');

    queryBuilder
      .where('product.userId = :userId', { userId })
      .andWhere('product.deletedAt IS NULL');

    // Filtro de busca (nome ou descrição)
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtro de categorias
    if (categories && categories.length > 0) {
      queryBuilder.andWhere('product.category IN (:...categories)', { categories });
    }

    // Filtro de estoque baixo
    if (lowStock !== undefined) {
      if (lowStock) {
        queryBuilder.andWhere('product.stockQuantity <= 0');
      } else {
        queryBuilder.andWhere('product.stockQuantity > 0');
      }
    }

    // Filtro de preço de venda
    if (minSalePrice !== undefined) {
      queryBuilder.andWhere('product.salePrice >= :minSalePrice', { minSalePrice });
    }
    if (maxSalePrice !== undefined) {
      queryBuilder.andWhere('product.salePrice <= :maxSalePrice', { maxSalePrice });
    }

    // Filtro de preço de custo
    if (minCostPrice !== undefined) {
      queryBuilder.andWhere('product.costPrice >= :minCostPrice', { minCostPrice });
    }
    if (maxCostPrice !== undefined) {
      queryBuilder.andWhere('product.costPrice <= :maxCostPrice', { maxCostPrice });
    }

    // Ordenação
    queryBuilder.orderBy('product.name', 'ASC');

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

  async findById(id: string, userId: string): Promise<Product | null> {
    return this.repository.findOne({
      where: { id, userId },
      withDeleted: false,
    });
  }

  async create(data: {
    userId: string;
    name: string;
    description?: string | null;
    category?: string | null;
    costPrice: number;
    salePrice: number;
    stockQuantity: number;
  }): Promise<Product> {
    const product = this.repository.create({
      userId: data.userId,
      name: data.name.trim(),
      description: data.description || null,
      category: data.category || null,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      stockQuantity: data.stockQuantity,
    });
    return this.repository.save(product);
  }

  async update(
    id: string,
    userId: string,
    data: {
      name?: string;
      description?: string | null;
      category?: string | null;
      costPrice?: number;
      salePrice?: number;
      stockQuantity?: number;
    },
  ): Promise<Product> {
    const product = await this.findById(id, userId);
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    if (data.name !== undefined) product.name = data.name.trim();
    if (data.description !== undefined) product.description = data.description;
    if (data.category !== undefined) product.category = data.category;
    if (data.costPrice !== undefined) product.costPrice = data.costPrice;
    if (data.salePrice !== undefined) product.salePrice = data.salePrice;
    if (data.stockQuantity !== undefined) product.stockQuantity = data.stockQuantity;

    return this.repository.save(product);
  }

  async delete(id: string, userId: string): Promise<void> {
    const product = await this.findById(id, userId);
    if (!product) {
      throw new Error('Produto não encontrado');
    }
    await this.repository.softDelete({ id, userId });
  }

  async bulkDelete(ids: string[], userId: string): Promise<void> {
    // Verificar se todos os produtos pertencem ao usuário
    const products = await this.repository.find({
      where: { id: In(ids), userId },
      withDeleted: false,
    });

    if (products.length !== ids.length) {
      throw new Error('Alguns produtos não foram encontrados ou não pertencem ao usuário');
    }

    await this.repository.softDelete({
      id: In(ids),
      userId,
    });
  }

  async findByCategory(userId: string, category: string): Promise<Product[]> {
    return this.repository.find({
      where: { userId, category },
      order: { name: 'ASC' },
      withDeleted: false,
    });
  }

  async findLowStock(userId: string): Promise<Product[]> {
    return this.repository.find({
      where: { userId },
    }).then(products => products.filter(p => p.stockQuantity <= 0));
  }
}


