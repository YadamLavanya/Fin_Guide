import { CohereClient } from 'cohere-ai';
import { LLMProvider, TransactionData, InsightData } from '../types';
import { generateLLMPrompt } from '../utils';

export class CohereProvider implements LLMProvider {
  private client: CohereClient;

  constructor({ apiKey }: { apiKey: string }) {
    this.client = new CohereClient({ apiKey });
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const response = await this.client.generate({
      model: 'command',
      prompt: generateLLMPrompt(data),
      format: 'json'
    });

    const generatedText = response.generations[0].text.trim();
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    if (!this.validateResponse(parsedResponse)) {
      throw new Error('Invalid response format');
    }

    return parsedResponse;
  }

  private validateResponse(response: any): response is InsightData {
    return (
      response &&
      Array.isArray(response.insights) &&
      Array.isArray(response.tips) &&
      typeof response.summary === 'string' &&
      response.insights.length > 0 &&
      response.tips.length > 0 &&
      response.summary.length > 0
    );
  }
}
