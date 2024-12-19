import { LLMProvider, TransactionData, InsightData } from '../types';
import { createFinancialPrompt } from '../utils';
import type { ProviderConfig } from '../factory';

export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: ProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama2';
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: createFinancialPrompt(data),
        stream: false
      })
    });

    const result = await response.json();
    return JSON.parse(result.response);
  }
}
