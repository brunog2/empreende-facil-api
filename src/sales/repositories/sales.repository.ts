import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale } from '../entities/sale.entity';
import { SaleItem } from '../entities/sale-item.entity';

@Injectable()
export class SalesRepository {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
  ) {}

  async findAll(userId: string): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { userId },
      relations: ['customer', 'saleItems', 'saleItems.product'],
      order: { saleDate: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<Sale | null> {
    return this.saleRepository.findOne({
      where: { id, userId },
      relations: ['customer', 'saleItems', 'saleItems.product'],
    });
  }

  async create(
    userId: string,
    data: {
      customerId?: string | null;
      totalAmount: number;
      paymentMethod?: string | null;
      notes?: string | null;
      saleDate?: Date;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
      }>;
    },
  ): Promise<Sale> {
    const sale = this.saleRepository.create({
      userId,
      customerId: data.customerId || null,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || null,
      saleDate: data.saleDate || new Date(),
    });

    const savedSale = await this.saleRepository.save(sale);

    const saleItems = data.items.map((item) =>
      this.saleItemRepository.create({
        saleId: savedSale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      }),
    );

    await this.saleItemRepository.save(saleItems);

    return this.findById(savedSale.id, userId);
  }

  async update(
    id: string,
    userId: string,
    data: {
      customerId?: string | null;
      totalAmount?: number;
      paymentMethod?: string | null;
      notes?: string | null;
      saleDate?: Date;
      items?: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
      }>;
    },
  ): Promise<Sale> {
    const sale = await this.findById(id, userId);
    if (!sale) {
      throw new Error('Venda não encontrada');
    }

    if (data.customerId !== undefined) sale.customerId = data.customerId;
    if (data.totalAmount !== undefined) sale.totalAmount = data.totalAmount;
    if (data.paymentMethod !== undefined) sale.paymentMethod = data.paymentMethod;
    if (data.notes !== undefined) sale.notes = data.notes;
    if (data.saleDate !== undefined) sale.saleDate = data.saleDate;

    await this.saleRepository.save(sale);

    if (data.items) {
      await this.saleItemRepository.delete({ saleId: id });

      const saleItems = data.items.map((item) =>
        this.saleItemRepository.create({
          saleId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        }),
      );

      await this.saleItemRepository.save(saleItems);
    }

    return this.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.saleRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new Error('Venda não encontrada');
    }
  }

  async getMonthlyTotal(userId: string, year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const sales = await this.saleRepository.find({
      where: {
        userId,
        saleDate: Between(startDate, endDate),
      },
    });

    return sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  }

  async getTopProducts(userId: string, limit: number = 5): Promise<Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>> {
    const sales = await this.findAll(userId);
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    sales.forEach((sale) => {
      sale.saleItems.forEach((item) => {
        const productId = item.productId;
        const product = productMap.get(productId) || {
          name: item.product?.name || 'Produto desconhecido',
          quantity: 0,
          revenue: 0,
        };

        product.quantity += item.quantity;
        product.revenue += Number(item.subtotal);
        productMap.set(productId, product);
      });
    });

    return Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        totalQuantity: data.quantity,
        totalRevenue: data.revenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }
}


