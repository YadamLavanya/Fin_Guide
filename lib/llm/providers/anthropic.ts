import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, TransactionData, InsightData } from '../types';
import { createFinancialPrompt } from '../utils';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor({ apiKey }: { apiKey: string }) {
    this.client = new Anthropic({ apiKey });
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const response = await this.client.messages.create({
      model: 'claude-2',
      messages: [{ role: 'user', content: createFinancialPrompt(data) }],
      response_format: { type: 'json' }
    });

    return JSON.parse(response.content[0].text);
  }
}
//TODO: Implement the AnthropicProvider class