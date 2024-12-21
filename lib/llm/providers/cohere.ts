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
        stop_sequences: ["}"],
        truncate: 'END'
      });

      const generatedText = response.generations[0].text.trim();
      
      // More robust JSON extraction
      let jsonStr = generatedText;
      if (!generatedText.startsWith('{')) {
        // Look for JSON-like content between curly braces
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }
        jsonStr = jsonMatch[0];
      }

      // Clean and normalize the JSON string
      jsonStr = jsonStr
        .replace(/[\u{0080}-\u{FFFF}]/gu, '') // Remove non-ASCII characters
        .replace(/\\[rnt]/g, ' ') // Replace escape sequences
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Ensure proper JSON structure
      if (!jsonStr.endsWith('}')) {
        jsonStr += '}';
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        // Try to fix common JSON issues
        jsonStr = jsonStr
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/([{,]\s*)"?(\w+)"?\s*:/g, '$1"$2":') // Fix unquoted keys
          .replace(/:\s*'([^']*)'/g, ':"$1"'); // Replace single quotes with double quotes

        try {
          parsedResponse = JSON.parse(jsonStr);
        } catch (finalError) {
          llmLogger.log({
            timestamp: new Date().toISOString(),
            provider: 'cohere',
            prompt,
            error: finalError,
            response: jsonStr,
            duration: Date.now() - startTime,
            success: false,
            level: 'error'
          });
          throw new Error('Failed to parse LLM response as JSON');
        }
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
