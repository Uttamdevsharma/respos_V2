export interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpensePayload {
  title: string;
  amount: number;
  category: string;
  date?: string;
  note?: string;
}

export interface AccountsSummaryBreakdown {
  date: string;
  revenue: number;
  expense: number;
  profit: number;
}

export interface AccountsSummary {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  breakdown: AccountsSummaryBreakdown[];
}
