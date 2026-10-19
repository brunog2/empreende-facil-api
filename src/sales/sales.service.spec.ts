import { ProductsRepository } from '../products/repositories/products.repository';
import { PlanLimitService } from '../subscriptions/services/plan-limit.service';
import { SalesRepository } from './repositories/sales.repository';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  it('registra o custo do produto no item da venda', async () => {
    const product = {
      id: 'product-1',
      name: 'Produto',
      salePrice: 100,
      costPrice: 40,
      stockQuantity: 10,
    };
    const repository = {
      create: jest.fn().mockResolvedValue({ id: 'sale-1' }),
    };
    const productsRepository = {
      findById: jest.fn().mockResolvedValue(product),
      update: jest.fn().mockResolvedValue(product),
    };
    const planLimitService = {
      assertCanCreate: jest.fn().mockResolvedValue(undefined),
    };
    const service = new SalesService(
      repository as unknown as SalesRepository,
      productsRepository as unknown as ProductsRepository,
      planLimitService as unknown as PlanLimitService,
    );

    await service.createSale('user-1', {
      totalAmount: 200,
      items: [{ productId: 'product-1', quantity: 2, unitPrice: 100 }],
    });

    expect(repository.create).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        items: [
          expect.objectContaining({
            productCostPrice: 40,
          }),
        ],
      }),
    );
  });
});
