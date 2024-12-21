import { LLMProvider, TransactionData, InsightData } from '../types';
import { generateLLMPrompt } from '../utils';
import { llmLogger } from '../logging';
import type { ProviderConfig } from '../factory';

export interface OllamaConfig extends ProviderConfig {
  baseUrl?: string;
  model?: string;
  customModel?: string;
  contextLength?: number;
  temperature?: number;
}

export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;
  private contextLength: number;
  private temperature: number;

  constructor(config: OllamaConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.customModel || config.model || 'llama2';
    this.contextLength = config.contextLength || 4096;
    this.temperature = config.temperature || 0.7;
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const startTime = Date.now();
    const prompt = generateLLMPrompt(data);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: `You are a financial analysis assistant. Analyze the following data and return a JSON response in this exact format, nothing else:
{
  "commentary": ["observation 1", "observation 2"],
  "tips": ["tip 1", "tip 2"]
}

Here's the data:
${prompt}`,
          options: {
            temperature: this.temperature,
            num_ctx: this.contextLength,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      // Collect the full response text
      let fullResponse = '';
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert the Uint8Array to text
        const chunk = new TextDecoder().decode(value);
        try {
          // Each chunk is a JSON object with a 'response' field
          const parsed = JSON.parse(chunk);
          fullResponse += parsed.response;
        } catch {
          // If parsing fails, just append the chunk
          fullResponse += chunk;
        }
      }

      // Extract JSON from the response
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      let parsedResponse;
      
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch {
          parsedResponse = {
            commentary: ['Failed to parse response'],
            tips: ['Please try again']
          };
        }
      } else {
        parsedResponse = {
          commentary: ['No valid JSON found in response'],
          tips: ['Please try again']
        };
      }

      // Ensure arrays
      if (!Array.isArray(parsedResponse.commentary)) {
        parsedResponse.commentary = [parsedResponse.commentary].filter(Boolean);
      }
      if (!Array.isArray(parsedResponse.tips)) {
        parsedResponse.tips = [parsedResponse.tips].filter(Boolean);
      }

      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: 'ollama',
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
        provider: 'ollama',
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
