import { CohereClient } from 'cohere-ai';
import { LLMProvider, TransactionData, InsightData } from '../types';
import { generateLLMPrompt } from '../utils';
import { llmLogger } from '../logging';
import type { ProviderConfig } from '../factory';

export class CohereProvider implements LLMProvider {
  private client: CohereClient;
  private model: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Cohere API key is required');
    }
    this.client = new CohereClient({ token: config.apiKey });
    this.model = config.model || 'command';
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const startTime = Date.now();
    const prompt = generateLLMPrompt(data);

    try {
      const response = await this.client.generate({
        model: this.model,
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7,
        format: 'json',
        stop_sequences: ["}"]  // Ensure clean JSON cutoff
      });

      const generatedText = response.generations[0].text.trim();
      
      // Enhanced JSON extraction
      let jsonStr = generatedText;
      if (!generatedText.startsWith('{')) {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }
        jsonStr = jsonMatch[0];
      }

      // Clean the JSON string
      jsonStr = jsonStr.replace(/\n/g, ' ')
                      .replace(/\r/g, ' ')
                      .replace(/\t/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();
      
      // Ensure the JSON string is properly terminated
      if (!jsonStr.endsWith('}')) {
        jsonStr += '}';
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        llmLogger.log({
          timestamp: new Date().toISOString(),
          provider: 'cohere',
          prompt,
          error: parseError,
          response: jsonStr,
          duration: Date.now() - startTime,
          success: false,
          level: 'error'
        });
        throw new Error('Failed to parse LLM response as JSON');
      }

      // Ensure required fields exist
      if (!parsedResponse.commentary) parsedResponse.commentary = [];
      if (!parsedResponse.tips) parsedResponse.tips = [];

      // Validate arrays
      if (!Array.isArray(parsedResponse.commentary) || !Array.isArray(parsedResponse.tips)) {
        throw new Error('Invalid response format: commentary and tips must be arrays');
      }

      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: 'cohere',
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
        provider: 'cohere',
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
