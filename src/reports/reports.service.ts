import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReportPeriodDto } from './dto/report-query.dto';
import { LOW_STOCK_THRESHOLD } from '../products/products.constants';
import { projectExpenses } from '../expenses/recurring-expenses';

interface Period {
  start: Date;
  endExclusive: Date;
  startDate: string;
  endDate: string;
}

interface SummaryRow {
  revenue: string;
  expenses: string;
  costOfGoodsSold: string;
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
  costOfGoodsSold: string;
  profit: string;
}

interface NamedTotalRow {
  name: string;
  total: string;
  count?: string;
  profit?: string;
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
  soldProducts: Array<{
    name: string;
    quantity: string;
    revenue: string;
    cost: string;
    profit: string;
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
          COALESCE((
            SELECT SUM(COALESCE(si.product_cost_price, 0) * si.quantity)
            FROM sale_items si
            INNER JOIN sales s ON s.id = si.sale_id
            WHERE s.user_id = $1 AND s.sale_date >= $2 AND s.sale_date < $3
          ), 0)::decimal(14,2)::text AS "costOfGoodsSold",
          (
            COALESCE((SELECT SUM(total_amount) FROM sales
              WHERE user_id = $1 AND sale_date >= $2 AND sale_date < $3), 0)
            -
            COALESCE((SELECT SUM(amount) FROM expenses
              WHERE user_id = $1 AND expense_date >= $2 AND expense_date < $3), 0)
            -
            COALESCE((SELECT SUM(COALESCE(si.product_cost_price, 0) * si.quantity)
              FROM sale_items si
              INNER JOIN sales s ON s.id = si.sale_id
              WHERE s.user_id = $1 AND s.sale_date >= $2 AND s.sale_date < $3), 0)
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
    const projectedExpenses = await this.loadProjectedExpenses(userId, period);
    const expensesTotal = projectedExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const revenue = Number(row?.revenue ?? 0);
    const costOfGoodsSold = Number(row?.costOfGoodsSold ?? 0);
    const productProfit = revenue - costOfGoodsSold;
    const operatingResult = productProfit - expensesTotal;

    return {
      period: { startDate: period.startDate, endDate: period.endDate },
      summary: {
        revenue: row?.revenue ?? '0.00',
        expenses: expensesTotal.toFixed(2),
        costOfGoodsSold: row?.costOfGoodsSold ?? '0.00',
        productProfit: productProfit.toFixed(2),
        operatingResult: operatingResult.toFixed(2),
        // Compatibilidade temporária com clientes que ainda consomem `profit`.
        profit: operatingResult.toFixed(2),
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
    const [
      monthly,
      topProducts,
      paymentMethods,
      customerGrowth,
    ] = await Promise.all([
      this.dataSource.query(
        `
            SELECT TO_CHAR(month, 'YYYY-MM') AS month,
              COALESCE((SELECT SUM(total_amount) FROM sales
                WHERE user_id = $1 AND sale_date >= month
                  AND sale_date < month + INTERVAL '1 month'), 0)::decimal(14,2)::text AS revenue,
              COALESCE((SELECT SUM(amount) FROM expenses
                WHERE user_id = $1 AND expense_date >= month
                  AND expense_date < month + INTERVAL '1 month'), 0)::decimal(14,2)::text AS expenses,
              COALESCE((SELECT SUM(COALESCE(si.product_cost_price, 0) * si.quantity)
                FROM sale_items si
                INNER JOIN sales s ON s.id = si.sale_id
                WHERE s.user_id = $1 AND s.sale_date >= month
                  AND s.sale_date < month + INTERVAL '1 month'), 0)::decimal(14,2)::text AS "costOfGoodsSold",
              (
                COALESCE((SELECT SUM(total_amount) FROM sales
                  WHERE user_id = $1 AND sale_date >= month
                    AND sale_date < month + INTERVAL '1 month'), 0)
                -
                COALESCE((SELECT SUM(amount) FROM expenses
                  WHERE user_id = $1 AND expense_date >= month
                    AND expense_date < month + INTERVAL '1 month'), 0)
                -
                COALESCE((SELECT SUM(COALESCE(si.product_cost_price, 0) * si.quantity)
                  FROM sale_items si
                  INNER JOIN sales s ON s.id = si.sale_id
                  WHERE s.user_id = $1 AND s.sale_date >= month
                    AND s.sale_date < month + INTERVAL '1 month'), 0)
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
              SUM(si.quantity)::decimal(14,3)::text AS count,
              SUM(si.subtotal - COALESCE(si.product_cost_price, 0) * si.quantity)::decimal(14,2)::text AS profit
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

    const projectedExpenses = await this.loadProjectedExpenses(userId, period);
    const expensesByMonth = new Map<string, number>();
    const expensesByCategory = new Map<string, number>();
    for (const expense of projectedExpenses) {
      const month = expense.date.slice(0, 7);
      expensesByMonth.set(month, (expensesByMonth.get(month) ?? 0) + expense.amount);
      expensesByCategory.set(
        expense.category,
        (expensesByCategory.get(expense.category) ?? 0) + expense.amount,
      );
    }

    return {
      period: { startDate: period.startDate, endDate: period.endDate },
      monthlyEvolution: monthly.map((item) => {
        const expenses = expensesByMonth.get(item.month) ?? 0;
        const revenue = Number(item.revenue);
        const costOfGoodsSold = Number(item.costOfGoodsSold);
        const productProfit = revenue - costOfGoodsSold;
        const operatingResult = productProfit - expenses;
        return {
          month: item.month,
          revenue: item.revenue,
          expenses: expenses.toFixed(2),
          costOfGoodsSold: item.costOfGoodsSold,
          productProfit: productProfit.toFixed(2),
          operatingResult: operatingResult.toFixed(2),
          // Compatibilidade temporária com clientes que ainda consomem `profit`.
          profit: operatingResult.toFixed(2),
        };
      }),
      topProducts: topProducts.map((item) => ({
        name: item.name,
        revenue: item.total,
        quantity: Number(item.count ?? 0),
        profit: item.profit ?? '0.00',
      })),
      salesByPaymentMethod: paymentMethods.map((item) => ({
        name: item.name,
        total: item.total,
        count: Number(item.count ?? 0),
      })),
      expensesByCategory: Array.from(expensesByCategory.entries())
        .map(([name, total]) => ({ name, total: total.toFixed(2) }))
        .sort((left, right) => Number(right.total) - Number(left.total)),
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
    const [report, sales, products, customers, soldProducts] = await Promise.all([
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
        `SELECT COALESCE(si.product_name, p.name, 'Produto removido') AS name,
          SUM(si.quantity)::decimal(14,3)::text AS quantity,
          SUM(si.subtotal)::decimal(14,2)::text AS revenue,
          SUM(COALESCE(si.product_cost_price, 0) * si.quantity)::decimal(14,2)::text AS cost,
          SUM(si.subtotal - COALESCE(si.product_cost_price, 0) * si.quantity)::decimal(14,2)::text AS profit
         FROM sale_items si
         INNER JOIN sales s ON s.id = si.sale_id
         LEFT JOIN products p ON p.id = si.product_id
         WHERE s.user_id = $1 AND s.sale_date >= $2 AND s.sale_date < $3
         GROUP BY COALESCE(si.product_name, p.name, 'Produto removido')
         ORDER BY SUM(si.subtotal - COALESCE(si.product_cost_price, 0) * si.quantity) DESC`,
        [userId, period.start, period.endExclusive],
      ) as Promise<ReportExportData['soldProducts']>,
    ]);
    const projectedExpenses = await this.loadProjectedExpenses(userId, period);
    return {
      period: report.period,
      summary: report.summary,
      sales,
      products,
      customers,
      soldProducts,
      expenses: projectedExpenses
        .sort((left, right) => right.date.localeCompare(left.date))
        .map((expense) => ({
          date: new Date(`${expense.date}T00:00:00`),
          description: expense.description,
          category: expense.category,
          amount: expense.amount.toFixed(2),
        })),
    };
  }

  private async loadProjectedExpenses(userId: string, period: Period) {
    const rows = (await this.dataSource.query(
      `SELECT description, amount::text AS amount, category,
        expense_date::text AS "expenseDate",
        is_recurring AS "isRecurring",
        recurrence_period AS "recurrencePeriod"
       FROM expenses
       WHERE user_id = $1
         AND (
           (is_recurring = false AND expense_date >= $2 AND expense_date < $3)
           OR (is_recurring = true AND expense_date < $3)
         )`,
      [userId, period.start, period.endExclusive],
    )) as Array<{
      description: string;
      amount: string;
      category: string;
      expenseDate: string;
      isRecurring: boolean;
      recurrencePeriod: string | null;
    }>;

    return projectExpenses(rows, period.startDate, period.endDate);
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
