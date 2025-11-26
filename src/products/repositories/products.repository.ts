import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

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
    });
  }

  async findById(id: string, userId: string): Promise<Product | null> {
    return this.repository.findOne({
      where: { id, userId },
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
    const result = await this.repository.delete({ id, userId });
    if (result.affected === 0) {
      throw new Error('Produto não encontrado');
    }
  }

  async findByCategory(userId: string, category: string): Promise<Product[]> {
    return this.repository.find({
      where: { userId, category },
      order: { name: 'ASC' },
    });
  }

  async findLowStock(userId: string): Promise<Product[]> {
    return this.repository.find({
      where: { userId },
    }).then(products => products.filter(p => p.stockQuantity <= 0));
  }
}


