
export interface DashboardStats {
  totalSpent: number;
  averageDaily: number;
  monthlyBudget: number;
  totalIncome: number;
  changes: {
    totalSpent: number;
    averageDaily: number;
    monthlyBudget: number;
  };
}

export interface MonthlyTrend {
  month: string;
  amount: number;
}

export interface ExpenseCategory {
  name: string;
  value: number;
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  date: string;
  paymentMethod: string;
}

export interface DashboardData {
  stats: DashboardStats;
  monthlyTrends: MonthlyTrend[];
  expenseCategories: ExpenseCategory[];
  recentTransactions: Transaction[];
}