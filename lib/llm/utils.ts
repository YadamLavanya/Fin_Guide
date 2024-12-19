import { TransactionData } from './types';

export function generateLLMPrompt(transactionData: TransactionData) {
  // Calculate percentage changes safely
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return previous === current ? 0 : 100;
    return ((current - previous) / previous) * 100;
  };

  const monthOverMonth = transactionData.previousMonth 
    ? `\nMonth-over-Month Comparison:
- Previous Month Income: $${transactionData.previousMonth.totalIncome}
- Previous Month Expenses: $${transactionData.previousMonth.totalExpenses}
- Income Change: ${calculatePercentageChange(transactionData.totalIncome, transactionData.previousMonth.totalIncome).toFixed(1)}%
- Expense Change: ${calculatePercentageChange(transactionData.totalExpenses, transactionData.previousMonth.totalExpenses).toFixed(1)}%`
    : '';

  const budgetStatus = transactionData.categories
    .filter(c => c.budget)
    .map(c => {
      const percentage = ((c.totalAmount / (c.budget || 1)) * 100).toFixed(1);
      return `\n- ${c.name}: $${c.totalAmount}/$${c.budget} (${percentage}% used)`;
    })
    .join('');

  const monthlyBudgetStatus = transactionData.monthlyBudget 
    ? `\nMonthly Budget: $${transactionData.totalExpenses}/$${transactionData.monthlyBudget} (${((transactionData.totalExpenses / transactionData.monthlyBudget) * 100).toFixed(1)}% used)`
    : '';

  const goals = transactionData.financialGoals
    ? `\nFinancial Goals:${transactionData.financialGoals
        .map(goal => `\n- ${goal.name}: $${goal.current}/$${goal.target} (${((goal.current / goal.target) * 100).toFixed(1)}% achieved)`)
        .join('')}`
    : '';

  return `Analyze this financial data and return a valid JSON response with the following structure:

{
  "summary": "Monthly financial overview",
  "insights": ["3-4 key spending insights"],
  "tips": ["2-3 actionable recommendations"],
  "monthOverMonth": {
    "insights": ["2-3 trend insights"],
    "changes": [
      {
        "category": "Category name",
        "previousAmount": previous month amount,
        "currentAmount": current month amount,
        "percentageChange": percentage change as number
      }
    ]
  },
  "budgetAlerts": [
    {
      "category": "Category name",
      "severity": "high|medium|low",
      "message": "Alert message",
      "percentage": number indicating overspending
    }
  ],
  "goals": [
    {
      "category": "Category name",
      "current": current amount as number,
      "target": target amount as number,
      "progress": progress as number (0-100),
      "description": "Human readable goal description",
      "type": "reduction" | "savings" | "limit"
    }
  ]
}

Financial Data:
${transactionData.categories.map(cat => 
  cat.budget ? `\nCategory ${cat.name}: Current $${cat.totalAmount} / Budget $${cat.budget}` : ''
).join('')}

Monthly Budget: $${transactionData.monthlyBudget || 0}
Current Spending: $${transactionData.totalExpenses}
${monthOverMonth}`;
}
