export interface TransactionData {
  totalIncome: number;
  totalExpenses: number;
  categories: Array<{
    name: string;
    totalAmount: number;
    type: 'income' | 'expense';
    budget?: number; // From Category.budget
  }>;
  previousMonth?: {
    totalIncome: number;
    totalExpenses: number;
    categories: Array<{
      name: string;
      totalAmount: number;
      type: 'income' | 'expense';
    }>;
  };
  monthlyBudget?: number; // From UserPreference.monthlyBudget
  budgetLimits?: {
    [category: string]: number;
  };
  financialGoals?: Array<{
    name: string;
    target: number;
    current: number;
    deadline?: string;
  }>;
}

interface BudgetAlert {
  category: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  current?: number;
  limit?: number;
  percentage?: number;
}

export interface InsightData {
  summary: string;
  insights: string[];
  tips: string[];
  monthOverMonth: {
    insights: string[];
    changes: Array<{
      category: string;
      previousAmount: number;
      currentAmount: number;
      percentageChange: number;
    }>;
  };
  budgetAlerts?: BudgetAlert[];
  goals: Array<{
    category: string;
    current: number;
    target: number;
    progress: number;
    description?: string;
  }>;
}

export interface LLMProvider {
  analyze(data: TransactionData, prompt?: string): Promise<InsightData>;
}
