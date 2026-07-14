import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { LOW_STOCK_THRESHOLD } from '../products.constants';
import { ProductsRepository } from './products.repository';

function createQueryBuilder() {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
}

describe('ProductsRepository - estoque baixo', () => {
  const queryBuilder = createQueryBuilder();
  const typeOrmRepository = {
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn(() => queryBuilder),
  } as unknown as Repository<Product>;
  const repository = new ProductsRepository(typeOrmRepository);

  beforeEach(() => jest.clearAllMocks());

  it('busca produtos com até 5 unidades e ignora excluídos', async () => {
    await repository.findLowStock('user-id');

    expect(typeOrmRepository.find).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        stockQuantity: expect.objectContaining({
          _type: 'lessThanOrEqual',
          _value: LOW_STOCK_THRESHOLD,
        }),
      },
      order: { stockQuantity: 'ASC', name: 'ASC' },
      withDeleted: false,
    });
  });

  it('aplica o mesmo limite no filtro de estoque baixo', async () => {
    await repository.findWithFilters('user-id', { lowStock: true });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.stockQuantity <= :lowStockThreshold',
      { lowStockThreshold: LOW_STOCK_THRESHOLD },
    );
  });

  it('considera estoque adequado somente acima do limite', async () => {
    await repository.findWithFilters('user-id', { lowStock: false });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'product.stockQuantity > :lowStockThreshold',
      { lowStockThreshold: LOW_STOCK_THRESHOLD },
    );
  });
});
