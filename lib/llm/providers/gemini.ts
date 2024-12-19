import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, TransactionData, InsightData } from '../types';
import { createFinancialPrompt } from '../utils';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;

  constructor({ apiKey }: { apiKey: string }) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(createFinancialPrompt(data));
    return JSON.parse(result.response.text());
  }
}
