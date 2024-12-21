import { TransactionData } from './types';

export function generateLLMPrompt(transactionData: TransactionData) {
  return `Based on this financial data, provide a light-hearted commentary and some personalized financial tips. Return a JSON response:

{
  "commentary": ["2-3 friendly observations about spending habits"],
  "tips": ["2-3 actionable financial tips"]
}

Monthly Summary:
- Total Income: $${transactionData.totalIncome}
- Total Expenses: $${transactionData.totalExpenses}
- Top Categories: ${transactionData.categories
    .filter(c => c.type === 'expense')
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 3)
    .map(c => `${c.name}: $${c.totalAmount}`)
    .join(', ')}`;
}
