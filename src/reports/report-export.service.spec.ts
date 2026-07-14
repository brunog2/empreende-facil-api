import { ReportExportService } from './report-export.service';
import { ReportExportData } from './reports.service';

const report: ReportExportData = {
  period: { startDate: '2026-07-01', endDate: '2026-07-31' },
  summary: {
    revenue: '100.00',
    expenses: '20.00',
    profit: '80.00',
    salesCount: 1,
    averageTicket: '100.00',
    products: 1,
    customers: 1,
    lowStockProducts: 0,
    stockValue: '50.00',
  },
  sales: [
    {
      date: new Date('2026-07-10T10:00:00Z'),
      customer: 'Cliente Teste',
      paymentMethod: 'pix',
      total: '100.00',
    },
  ],
  products: [
    {
      name: 'Produto Teste',
      category: 'Categoria',
      costPrice: '50.00',
      salePrice: '100.00',
      stockQuantity: '1',
    },
  ],
  customers: [
    {
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      phone: null,
      createdAt: new Date('2026-07-01T10:00:00Z'),
    },
  ],
  expenses: [
    {
      date: new Date('2026-07-09T10:00:00Z'),
      description: 'Despesa Teste',
      category: 'Operacional',
      amount: '20.00',
    },
  ],
};

describe('ReportExportService', () => {
  const service = new ReportExportService();

  it('gera uma planilha Excel válida', async () => {
    const content = await service.toExcel(report);
    expect(content.subarray(0, 2).toString()).toBe('PK');
    expect(content.length).toBeGreaterThan(1_000);
  });

  it('gera um documento PDF válido', async () => {
    const content = await service.toPdf(report);
    expect(content.subarray(0, 4).toString()).toBe('%PDF');
    expect(content.length).toBeGreaterThan(500);
  });
});
