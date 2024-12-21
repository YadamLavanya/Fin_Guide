import { TransactionData } from './types';

export function generateLLMPrompt(transactionData: TransactionData) {
  return `Analyze this financial data and provide a light-hearted commentary with some personalized financial tips. You must respond with ONLY a valid JSON object in this exact format:

{
  "commentary": [
    "first observation about spending",
    "second observation about spending",
    "third observation about spending"
  ],
  "tips": [
    "first actionable tip",
    "second actionable tip",
    "third actionable tip"
  ]
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
