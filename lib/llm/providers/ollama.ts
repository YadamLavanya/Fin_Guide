import { Ollama } from 'ollama';
import { LLMProvider, TransactionData, InsightData, ChatMessage, ChatResponse } from '../types';
import { generateLLMPrompt } from '../utils';
import { llmLogger } from '../logging';
import type { ProviderConfig } from '../factory';

export interface OllamaConfig extends ProviderConfig {
  baseUrl?: string;
  model?: string;
  customModel?: string;
  contextLength?: number;
  temperature?: number;
  mode?: 'insights' | 'chat';
}

export class OllamaProvider implements LLMProvider {
  private client: Ollama;
  private model: string;
  private temperature: number;
  private mode: 'insights' | 'chat';

  constructor(config: OllamaConfig) {
    this.client = new Ollama({
      host: config.baseUrl || 'http://localhost:11434'
    });
    this.model = config.customModel || config.model || 'llama2';
    this.temperature = config.temperature || 0.7;
    this.mode = config.mode || 'insights';
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const startTime = Date.now();
    const prompt = generateLLMPrompt(data);

    try {
      const response = await this.client.chat({
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
        format: 'json',
        options: {
          temperature: this.temperature
        }
      });

      const content = response.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch {
        parsedResponse = {
          commentary: ['Failed to parse JSON response'],
          tips: ['Please try again']
        };
      }
      
      // Ensure response has required structure
      if (!Array.isArray(parsedResponse.commentary) || !Array.isArray(parsedResponse.tips)) {
        parsedResponse = {
          commentary: Array.isArray(parsedResponse.commentary) ? parsedResponse.commentary : [],
          tips: Array.isArray(parsedResponse.tips) ? parsedResponse.tips : []
        };
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

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      const response = await this.client.chat({
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        options: {
          temperature: this.temperature
        }
      });

      const content = response.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const chatResponse: ChatResponse = {
        content
      };

      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: 'ollama',
        response: chatResponse,
        duration: Date.now() - startTime,
        success: true,
        level: 'info',
        prompt: messages[messages.length - 1]?.content || ''
      });

      return chatResponse;
    } catch (error) {
      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: 'ollama',
        error,
        duration: Date.now() - startTime,
        success: false,
        level: 'error',
        prompt: messages[messages.length - 1]?.content || ''
      });
      throw error;
    }
  }
}
