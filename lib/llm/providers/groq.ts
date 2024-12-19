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
            content: 'You are a financial analysis assistant. Always respond with valid JSON. Handle missing data with defaults and avoid Infinity/NaN values.' 
          },
          { 
            role: 'user', 
            content: `Analyze this financial data and respond with JSON:\n${prompt}` 
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7 // Add some variability while maintaining coherence
      });

      let result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Ensure all required arrays exist
      result = {
        ...result,
        insights: result.insights || [],
        tips: result.tips || [],
        monthOverMonth: {
          insights: result.monthOverMonth?.insights || [],
          changes: result.monthOverMonth?.changes || []
        },
        budgetAlerts: result.budgetAlerts || [],
        goals: result.goals || []
      };

      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: 'groq',
        prompt,
        response: result,
        duration: Date.now() - startTime,
        success: true,
        level: 'info'
      });

      return result;
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
