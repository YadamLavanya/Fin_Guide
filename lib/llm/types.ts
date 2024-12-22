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
  commentary: string[];  // Make this required, not optional
  tips?: string[];
  summary?: string;
  monthOverMonth?: {
    insights: string[];
    changes: {
      category: string;
      previousAmount: number;
      currentAmount: number;
      percentageChange: number;
    }[];
  };
  budgetAlerts?: {
    category: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    percentage: number;
  }[];
  goals?: {
    category: string;
    current: number;
    target: number;
    progress: number;
    description: string;
    type: 'reduction' | 'savings' | 'limit';
  }[];
  stats?: {
    savingsRate: number;
    balance: number;
    topExpenses: any[];
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface LLMProvider {
  analyze(data: TransactionData, prompt?: string): Promise<InsightData>;
  chat?(messages: ChatMessage[]): Promise<ChatResponse>;
}

export interface LLMCapabilities {
  supportsChat: boolean;
  supportsInsights: boolean;
  maxTokens?: number;
  supportsFunctionCalling?: boolean;
  supportsStreaming?: boolean;
}
