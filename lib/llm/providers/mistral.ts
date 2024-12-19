import MistralClient from '@mistralai/mistralai';
import { LLMProvider, TransactionData, InsightData } from '../types';
import { createFinancialPrompt } from '../utils';
import type { ProviderConfig } from '../factory';

export class MistralProvider implements LLMProvider {
  private client: MistralClient;
  private model: string;

  constructor(config: ProviderConfig) {
    this.client = new MistralClient(config.apiKey);
    this.model = config.model || 'mistral-medium';
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const response = await this.client.chat({
      model: this.model,
      messages: [{ role: 'user', content: createFinancialPrompt(data) }]
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
