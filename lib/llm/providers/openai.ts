import OpenAI from 'openai';
import { LLMProvider, TransactionData, InsightData } from '../types';
import { createFinancialPrompt } from '../utils';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor({ apiKey }: { apiKey: string }) {
    this.client = new OpenAI({ apiKey });
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: "user", content: createFinancialPrompt(data) }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }
}
//todo: implement the OpenAIProvider class