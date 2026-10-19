import { DataSource } from 'typeorm';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  it('retorna CMV e resultado operacional calculados no banco', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        revenue: '1000.00',
        expenses: '200.00',
        costOfGoodsSold: '400.00',
        profit: '400.00',
        salesCount: '10',
        averageTicket: '100.00',
        products: '20',
        customers: '8',
        lowStockProducts: '2',
        stockValue: '1500.00',
      },
    ]);
    const dataSource = { query } as unknown as DataSource;
    const service = new ReportsService(dataSource);

    const result = await service.getSummary('user-1', {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.summary).toMatchObject({
      revenue: '1000.00',
      expenses: '200.00',
      costOfGoodsSold: '400.00',
      operatingResult: '400.00',
      profit: '400.00',
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('product_cost_price'),
      expect.arrayContaining(['user-1']),
    );
  });
});
