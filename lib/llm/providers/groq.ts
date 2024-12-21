import { Groq } from 'groq-sdk';
import { LLMProvider, TransactionData, InsightData } from '../types';
import { generateLLMPrompt } from '../utils';
import { llmLogger } from '../logging';
import type { ProviderConfig } from '../factory';

export class GroqProvider implements LLMProvider {
  private client: Groq;
  private model: string;

  constructor(config: ProviderConfig) {
    this.client = new Groq({ apiKey: config.apiKey });
    this.model = config.model || 'mixtral-8x7b-32768';
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const startTime = Date.now();
    const prompt = generateLLMPrompt(data);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'You are a financial analysis assistant. Return valid JSON with commentary and tips arrays.' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      });

      const content = response.choices[0].message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      let parsedResponse = JSON.parse(content);
      
      // Ensure response has required structure
      if (!Array.isArray(parsedResponse.commentary) || !Array.isArray(parsedResponse.tips)) {
        parsedResponse = {
          commentary: [],
          tips: []
        };
      }

      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: 'groq',
        prompt,
        response: parsedResponse,
        duration: Date.now() - startTime,
        success: true,
        level: 'info'
      });

      return parsedResponse;
    } catch (error) {
      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: 'groq',
        prompt,
        error,
        duration: Date.now() - startTime,
        success: false,
        level: 'error'
      });
      throw error;
    }
  }
}
