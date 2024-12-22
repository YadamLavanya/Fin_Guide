import { TransactionData } from './types';

const DEFAULT_INSIGHTS_PROMPT = `Analyze this financial data and provide a light-hearted commentary with some personalized financial tips. You must respond with ONLY a valid JSON object in this exact format:

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
}`;

const DEFAULT_CHAT_PROMPT = `You are a helpful financial assistant. Your role is to help users understand their finances, provide budgeting advice, and answer questions about personal finance.

Key responsibilities:
- Answer financial questions clearly and concisely
- Provide practical, actionable advice
- Explain financial concepts in simple terms
- Stay focused on personal finance topics
- Be friendly and encouraging

Remember to:
- Be clear and direct in your responses
- Use specific examples when helpful
- Avoid overly technical jargon
- Never provide specific investment advice
- Maintain a supportive and non-judgmental tone`;

export function getSystemPrompt(mode: 'insights' | 'chat'): string {
  if (typeof window !== 'undefined') {
    if (mode === 'chat') {
      return localStorage.getItem('chat-system-prompt') || DEFAULT_CHAT_PROMPT;
    }
    return localStorage.getItem('insights-system-prompt') || DEFAULT_INSIGHTS_PROMPT;
  }
  return mode === 'chat' ? DEFAULT_CHAT_PROMPT : DEFAULT_INSIGHTS_PROMPT;
}

export function setSystemPrompt(mode: 'insights' | 'chat', prompt: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${mode}-system-prompt`, prompt);
  }
}

export function resetSystemPrompt(mode: 'insights' | 'chat') {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${mode}-system-prompt`);
  }
}

export function generateLLMPrompt(transactionData: TransactionData) {
  const systemPrompt = getSystemPrompt('insights');
  return `${systemPrompt}

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
