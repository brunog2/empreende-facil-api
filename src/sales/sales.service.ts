import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesRepository } from './repositories/sales.repository';
import { ProductsRepository } from '../products/repositories/products.repository';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    private repository: SalesRepository,
    private productsRepository: ProductsRepository,
  ) {}

  async getAllSales(userId: string) {
    return this.repository.findAll(userId);
  }

  async getSaleById(id: string, userId: string) {
    const sale = await this.repository.findById(id, userId);
    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }
    return sale;
  }

  async createSale(userId: string, data: CreateSaleDto) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('A venda deve ter pelo menos um item');
    }

    // Validar estoque e calcular total
    let calculatedTotal = 0;
    for (const item of data.items) {
      const product = await this.productsRepository.findById(item.productId, userId);
      if (!product) {
        throw new NotFoundException(`Produto ${item.productId} não encontrado`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto ${product.name}. Disponível: ${product.stockQuantity}, Solicitado: ${item.quantity}`,
        );
      }

      calculatedTotal += item.quantity * item.unitPrice;
    }

    // Validar se o total informado corresponde ao calculado
    if (Math.abs(calculatedTotal - data.totalAmount) > 0.01) {
      throw new BadRequestException(
        `O valor total informado (${data.totalAmount}) não corresponde ao valor calculado (${calculatedTotal})`,
      );
    }

    // Criar a venda
    const sale = await this.repository.create(userId, {
      customerId: data.customerId,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      saleDate: data.saleDate,
      items: data.items,
    });

    // Atualizar estoque dos produtos
    for (const item of data.items) {
      const product = await this.productsRepository.findById(item.productId, userId);
      if (product) {
        product.stockQuantity -= item.quantity;
        await this.productsRepository.update(product.id, userId, {
          stockQuantity: product.stockQuantity,
        });
      }
    }

    return sale;
  }

  async updateSale(id: string, userId: string, data: UpdateSaleDto) {
    const sale = await this.repository.findById(id, userId);
    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    // Se houver itens, validar estoque
    if (data.items && data.items.length > 0) {
      let calculatedTotal = 0;
      for (const item of data.items) {
        const product = await this.productsRepository.findById(item.productId, userId);
        if (!product) {
          throw new NotFoundException(`Produto ${item.productId} não encontrado`);
        }

        // Verificar estoque disponível (considerando itens já vendidos)
        const existingItem = sale.saleItems.find((si) => si.productId === item.productId);
        const currentStock = existingItem
          ? product.stockQuantity + existingItem.quantity
          : product.stockQuantity;

        if (currentStock < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para o produto ${product.name}. Disponível: ${currentStock}, Solicitado: ${item.quantity}`,
          );
        }

        calculatedTotal += item.quantity * item.unitPrice;
      }

      if (data.totalAmount && Math.abs(calculatedTotal - data.totalAmount) > 0.01) {
        throw new BadRequestException(
          `O valor total informado (${data.totalAmount}) não corresponde ao valor calculado (${calculatedTotal})`,
        );
      }

      if (data.totalAmount === undefined) {
        data.totalAmount = calculatedTotal;
      }

      // Calcular mudanças de estoque antes de atualizar a venda
      // Criar um mapa para rastrear mudanças de estoque por produto
      const stockChanges = new Map<string, number>();

      // Restaurar estoque dos itens antigos (adicionar de volta)
      for (const oldItem of sale.saleItems) {
        const currentChange = stockChanges.get(oldItem.productId) || 0;
        stockChanges.set(oldItem.productId, currentChange + oldItem.quantity);
      }

      // Reduzir estoque dos novos itens (subtrair)
      if (data.items) {
        for (const item of data.items) {
          const currentChange = stockChanges.get(item.productId) || 0;
          stockChanges.set(item.productId, currentChange - item.quantity);
        }
      }

      // Aplicar todas as mudanças de estoque ANTES de atualizar a venda
      // Isso garante que o estoque está correto antes de persistir a venda
      for (const [productId, quantityChange] of stockChanges.entries()) {
        const product = await this.productsRepository.findById(productId, userId);
        if (product) {
          product.stockQuantity += quantityChange;
          await this.productsRepository.update(product.id, userId, {
            stockQuantity: product.stockQuantity,
          });
        }
      }

      // Agora atualizar a venda (estoque já foi ajustado)
      const updatedSale = await this.repository.update(id, userId, data);

      return updatedSale;
    }

    return this.repository.update(id, userId, data);
  }

  async deleteSale(id: string, userId: string) {
    const sale = await this.repository.findById(id, userId);
    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    // Restaurar estoque dos produtos
    for (const item of sale.saleItems) {
      const product = await this.productsRepository.findById(item.productId, userId);
      if (product) {
        product.stockQuantity += item.quantity;
        await this.productsRepository.update(product.id, userId, {
          stockQuantity: product.stockQuantity,
        });
      }
    }

    return this.repository.delete(id, userId);
  }

  async getMonthlyTotal(userId: string, year: number, month: number) {
    return this.repository.getMonthlyTotal(userId, year, month);
  }

  async getTopProducts(userId: string, limit: number = 5) {
    return this.repository.getTopProducts(userId, limit);
  }
}


