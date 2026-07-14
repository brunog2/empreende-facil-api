import { Repository } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Product } from '../../products/entities/product.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { PlanLimit } from '../constants/subscription.constants';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionAccessService } from './subscription-access.service';
import { PlanLimitService } from './plan-limit.service';

function queryBuilder(count: number) {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(count),
  };
}

describe('PlanLimitService', () => {
  const productQuery = queryBuilder(30);
  const saleQuery = queryBuilder(50);
  const products = {
    createQueryBuilder: jest.fn(() => productQuery),
  } as unknown as Repository<Product>;
  const customers = {
    count: jest.fn().mockResolvedValue(30),
  } as unknown as Repository<Customer>;
  const sales = {
    createQueryBuilder: jest.fn(() => saleQuery),
  } as unknown as Repository<Sale>;
  const access = {
    getCurrentOrThrow: jest.fn().mockResolvedValue({
      plan: { limits: { products: 30, customers: 30, salesPerMonth: 50 } },
    } as unknown as Subscription),
  } as unknown as SubscriptionAccessService;
  const service = new PlanLimitService(products, customers, sales, access);

  it.each([
    [PlanLimit.Products, 'products'],
    [PlanLimit.Customers, 'customers'],
    [PlanLimit.SalesPerMonth, 'sales'],
  ])('retorna PLAN_LIMIT_REACHED para %s', async (limit) => {
    await expect(
      service.assertCanCreate(
        'user-id',
        limit,
      ),
    ).rejects.toMatchObject({
      response: { code: 'PLAN_LIMIT_REACHED' },
    });
  });
});
