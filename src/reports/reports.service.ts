import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReportPeriodDto } from './dto/report-query.dto';
import { LOW_STOCK_THRESHOLD } from '../products/products.constants';

interface Period {
  start: Date;
  endExclusive: Date;
  startDate: string;
  endDate: string;
}

interface SummaryRow {
  revenue: string;
  expenses: string;
  profit: string;
  salesCount: string;
  averageTicket: string;
  products: string;
  customers: string;
  lowStockProducts: string;
  stockValue: string;
}

interface MonthlyRow {
  month: string;
  revenue: string;
  expenses: string;
  profit: string;
}

interface NamedTotalRow {
  name: string;
  total: string;
  count?: string;
}

interface CustomerGrowthRow {
  month: string;
  newCustomers: string;
}

export interface ReportExportData {
  period: { startDate: string; endDate: string };
  summary: Awaited<ReturnType<ReportsService['getSummary']>>['summary'];
  sales: Array<{
    date: Date;
    customer: string | null;
    paymentMethod: string | null;
    total: string;
  }>;
  products: Array<{
    name: string;
    category: string | null;
    costPrice: string;
    salePrice: string;
    stockQuantity: string;
  }>;
  customers: Array<{
    name: string;
    email: string | null;
    phone: string | null;
    createdAt: Date;
  }>;
  expenses: Array<{
    date: Date;
    description: string;
    category: string;
    amount: string;
  }>;
}

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary(userId: string, query: ReportPeriodDto) {
    const period = this.normalizePeriod(query);
    const rows = (await this.dataSource.query(
      `
        SELECT
          COALESCE((
            SELECT SUM(total_amount) FROM sales
            WHERE user_id = $1 AND sale_date >= $2 AND sale_date < $3
          ), 0)::decimal(14,2)::text AS revenue,
          COALESCE((
            SELECT SUM(amount) FROM expenses
            WHERE user_id = $1 AND expense_date >= $2 AND expense_date < $3
          ), 0)::decimal(14,2)::text AS expenses,
          (
            COALESCE((SELECT SUM(total_amount) FROM sales
              WHERE user_id = $1 AND sale_date >= $2 AND sale_date < $3), 0)
            -
            COALESCE((SELECT SUM(amount) FROM expenses
              WHERE user_id = $1 AND expense_date >= $2 AND expense_date < $3), 0)
          )::decimal(14,2)::text AS profit,
          (SELECT COUNT(*) FROM sales
            WHERE user_id = $1 AND sale_date >= $2 AND sale_date < $3)::text AS "salesCount",
          COALESCE((
            SELECT SUM(total_amount) / NULLIF(COUNT(*), 0)
            FROM sales
            WHERE user_id = $1 AND sale_date >= $2 AND sale_date < $3
          ), 0)::decimal(14,2)::text AS "averageTicket",
          (SELECT COUNT(*) FROM products
            WHERE user_id = $1 AND deleted_at IS NULL)::text AS products,
          (SELECT COUNT(*) FROM customers WHERE user_id = $1)::text AS customers,
          (SELECT COUNT(*) FROM products
            WHERE user_id = $1 AND deleted_at IS NULL
              AND stock_quantity <= $4)::text AS "lowStockProducts",
          COALESCE((SELECT SUM(cost_price * stock_quantity) FROM products
            WHERE user_id = $1 AND deleted_at IS NULL), 0)::decimal(14,2)::text AS "stockValue"
      `,
      [userId, period.start, period.endExclusive, LOW_STOCK_THRESHOLD],
    )) as SummaryRow[];
    const row = rows[0];
    const salesCount = Number(row?.salesCount ?? 0);

    return {
      period: { startDate: period.startDate, endDate: period.endDate },
      summary: {
        revenue: row?.revenue ?? '0.00',
        expenses: row?.expenses ?? '0.00',
        profit: row?.profit ?? '0.00',
        salesCount,
        averageTicket: row?.averageTicket ?? '0.00',
        products: Number(row?.products ?? 0),
        customers: Number(row?.customers ?? 0),
        lowStockProducts: Number(row?.lowStockProducts ?? 0),
        stockValue: row?.stockValue ?? '0.00',
      },
    };
  }

  async getAdvanced(userId: string, query: ReportPeriodDto) {
    const period = this.normalizePeriod(query);
    const [monthly, topProducts, paymentMethods, expenseCategories, customerGrowth] =
      await Promise.all([
        this.dataSource.query(
          `
            SELECT TO_CHAR(month, 'YYYY-MM') AS month,
              COALESCE((SELECT SUM(total_amount) FROM sales
                WHERE user_id = $1 AND sale_date >= month
                  AND sale_date < month + INTERVAL '1 month'), 0)::decimal(14,2)::text AS revenue,
              COALESCE((SELECT SUM(amount) FROM expenses
                WHERE user_id = $1 AND expense_date >= month
                  AND expense_date < month + INTERVAL '1 month'), 0)::decimal(14,2)::text AS expenses,
              (
                COALESCE((SELECT SUM(total_amount) FROM sales
                  WHERE user_id = $1 AND sale_date >= month
                    AND sale_date < month + INTERVAL '1 month'), 0)
                -
                COALESCE((SELECT SUM(amount) FROM expenses
                  WHERE user_id = $1 AND expense_date >= month
                    AND expense_date < month + INTERVAL '1 month'), 0)
              )::decimal(14,2)::text AS profit
            FROM GENERATE_SERIES(
              DATE_TRUNC('month', $2::timestamptz),
              DATE_TRUNC('month', $3::timestamptz - INTERVAL '1 day'),
              INTERVAL '1 month'
            ) month
            ORDER BY month
          `,
          [userId, period.start, period.endExclusive],
        ) as Promise<MonthlyRow[]>,
        this.dataSource.query(
          `
            SELECT COALESCE(si.product_name, p.name, 'Produto removido') AS name,
              SUM(si.subtotal)::decimal(14,2)::text AS total,
              SUM(si.quantity)::decimal(14,3)::text AS count
            FROM sale_items si
            INNER JOIN sales s ON s.id = si.sale_id
            LEFT JOIN products p ON p.id = si.product_id
            WHERE s.user_id = $1 AND s.sale_date >= $2 AND s.sale_date < $3
            GROUP BY COALESCE(si.product_name, p.name, 'Produto removido')
            ORDER BY SUM(si.subtotal) DESC
            LIMIT 10
          `,
          [userId, period.start, period.endExclusive],
        ) as Promise<NamedTotalRow[]>,
        this.dataSource.query(
          `
            SELECT COALESCE(payment_method, 'Não informado') AS name,
              SUM(total_amount)::decimal(14,2)::text AS total,
              COUNT(*)::text AS count
            FROM sales
            WHERE user_id = $1 AND sale_date >= $2 AND sale_date < $3
            GROUP BY COALESCE(payment_method, 'Não informado')
            ORDER BY SUM(total_amount) DESC
          `,
          [userId, period.start, period.endExclusive],
        ) as Promise<NamedTotalRow[]>,
        this.dataSource.query(
          `
            SELECT category AS name, SUM(amount)::decimal(14,2)::text AS total
            FROM expenses
            WHERE user_id = $1 AND expense_date >= $2 AND expense_date < $3
            GROUP BY category
            ORDER BY SUM(amount) DESC
          `,
          [userId, period.start, period.endExclusive],
        ) as Promise<NamedTotalRow[]>,
        this.dataSource.query(
          `
            SELECT TO_CHAR(month, 'YYYY-MM') AS month,
              COUNT(customers.id)::text AS "newCustomers"
            FROM GENERATE_SERIES(
              DATE_TRUNC('month', $2::timestamptz),
              DATE_TRUNC('month', $3::timestamptz - INTERVAL '1 day'),
              INTERVAL '1 month'
            ) month
            LEFT JOIN customers ON customers.user_id = $1
              AND customers.created_at >= month
              AND customers.created_at < month + INTERVAL '1 month'
            GROUP BY month
            ORDER BY month
          `,
          [userId, period.start, period.endExclusive],
        ) as Promise<CustomerGrowthRow[]>,
      ]);

    return {
      period: { startDate: period.startDate, endDate: period.endDate },
      monthlyEvolution: monthly.map((item) => ({
        month: item.month,
        revenue: item.revenue,
        expenses: item.expenses,
        profit: item.profit,
      })),
      topProducts: topProducts.map((item) => ({
        name: item.name,
        revenue: item.total,
        quantity: Number(item.count ?? 0),
      })),
      salesByPaymentMethod: paymentMethods.map((item) => ({
        name: item.name,
        total: item.total,
        count: Number(item.count ?? 0),
      })),
      expensesByCategory: expenseCategories.map((item) => ({
        name: item.name,
        total: item.total,
      })),
      customerGrowth: customerGrowth.map((item) => ({
        month: item.month,
        newCustomers: Number(item.newCustomers),
      })),
    };
  }

  async getExportData(
    userId: string,
    query: ReportPeriodDto,
  ): Promise<ReportExportData> {
    const period = this.normalizePeriod(query);
    const [report, sales, products, customers, expenses] = await Promise.all([
      this.getSummary(userId, query),
      this.dataSource.query(
        `SELECT s.sale_date AS date, c.name AS customer,
          s.payment_method AS "paymentMethod", s.total_amount::text AS total
         FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
         WHERE s.user_id = $1 AND s.sale_date >= $2 AND s.sale_date < $3
         ORDER BY s.sale_date DESC`,
        [userId, period.start, period.endExclusive],
      ) as Promise<ReportExportData['sales']>,
      this.dataSource.query(
        `SELECT name, category, cost_price::text AS "costPrice",
          sale_price::text AS "salePrice", stock_quantity::text AS "stockQuantity"
         FROM products WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name`,
        [userId],
      ) as Promise<ReportExportData['products']>,
      this.dataSource.query(
        `SELECT name, email, phone, created_at AS "createdAt"
         FROM customers WHERE user_id = $1 ORDER BY name`,
        [userId],
      ) as Promise<ReportExportData['customers']>,
      this.dataSource.query(
        `SELECT expense_date AS date, description, category, amount::text AS amount
         FROM expenses WHERE user_id = $1 AND expense_date >= $2 AND expense_date < $3
         ORDER BY expense_date DESC`,
        [userId, period.start, period.endExclusive],
      ) as Promise<ReportExportData['expenses']>,
    ]);
    return { period: report.period, summary: report.summary, sales, products, customers, expenses };
  }

  private normalizePeriod(query: ReportPeriodDto): Period {
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const start = query.startDate
      ? new Date(`${query.startDate}T00:00:00`)
      : defaultStart;
    const endInclusive = query.endDate
      ? new Date(`${query.endDate}T00:00:00`)
      : new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(endInclusive.getTime()) ||
      start > endInclusive
    ) {
      throw new BadRequestException('Período do relatório inválido.');
    }
    const endExclusive = new Date(endInclusive);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const toDate = (date: Date) => date.toISOString().slice(0, 10);
    return {
      start,
      endExclusive,
      startDate: toDate(start),
      endDate: toDate(endInclusive),
    };
  }
}
