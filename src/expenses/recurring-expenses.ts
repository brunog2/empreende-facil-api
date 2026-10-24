const PERIOD_STEPS: Record<string, (date: Date) => void> = {
  diaria: (date) => date.setDate(date.getDate() + 1),
  semanal: (date) => date.setDate(date.getDate() + 7),
  quinzenal: (date) => date.setDate(date.getDate() + 14),
  mensal: (date) => date.setMonth(date.getMonth() + 1),
  trimestral: (date) => date.setMonth(date.getMonth() + 3),
  semestral: (date) => date.setMonth(date.getMonth() + 6),
  anual: (date) => date.setFullYear(date.getFullYear() + 1),
};

export interface RecurringExpenseRow {
  description: string;
  amount: string;
  category: string;
  expenseDate: Date | string;
  isRecurring: boolean;
  recurrencePeriod: string | null;
}

export interface ProjectedExpense {
  date: string;
  description: string;
  category: string;
  amount: number;
}

function dateOnly(value: Date | string) {
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
  return value.slice(0, 10);
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function projectExpenses(
  expenses: RecurringExpenseRow[],
  rangeStart: string,
  rangeEnd: string,
): ProjectedExpense[] {
  const projected: ProjectedExpense[] = [];

  for (const expense of expenses) {
    const anchor = dateOnly(expense.expenseDate);
    const step = expense.recurrencePeriod
      ? PERIOD_STEPS[expense.recurrencePeriod]
      : undefined;
    const amount = Number(expense.amount);
    const dates: string[] = [];

    if (!expense.isRecurring || !step) {
      if (anchor >= rangeStart && anchor <= rangeEnd) dates.push(anchor);
    } else {
      const cursor = parseDate(anchor);
      for (let guard = 0; guard < 4000; guard += 1) {
        const current = formatDate(cursor);
        if (current > rangeEnd) break;
        if (current >= rangeStart) dates.push(current);
        const previous = current;
        step(cursor);
        if (formatDate(cursor) <= previous) break;
      }
    }

    for (const date of dates) {
      projected.push({
        date,
        description: expense.description,
        category: expense.category,
        amount,
      });
    }
  }

  return projected;
}
