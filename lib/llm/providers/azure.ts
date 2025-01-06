import { AzureOpenAI } from "openai";
import { LLMProvider, TransactionData, InsightData, ChatMessage, ChatResponse } from '../types';
import { generateLLMPrompt } from '../utils';
import { llmLogger } from '../logging';
import type { ProviderConfig } from '../factory';

export class AzureProvider implements LLMProvider {
  private client: AzureOpenAI;
  private model: string;
  private deploymentId: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Azure API key is required');
    }
    if (!config.baseUrl) {
      throw new Error('Azure endpoint URL is required');
    }
    if (!config.model) {
      throw new Error('Azure deployment ID is required');
    }

    this.client = new AzureOpenAI({
      apiKey: config.apiKey,
      endpoint: config.baseUrl,
      deployment: config.model,
      apiVersion: "2024-02-15-preview"
    });
    this.model = config.model;
    this.deploymentId = config.model;
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const startTime = Date.now();
    const prompt = generateLLMPrompt(data);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      const generatedText = response.choices[0].message?.content?.trim() || '';
      
      // Extract and clean JSON
      let jsonStr = generatedText;
      if (!generatedText.startsWith('{')) {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }
        jsonStr = jsonMatch[0];
      }

      // Clean and normalize JSON string
      jsonStr = jsonStr
        .replace(/[\u{0080}-\u{FFFF}]/gu, '')
        .replace(/\\[rnt]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!jsonStr.endsWith('}')) {
        jsonStr += '}';
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        // Fix common JSON issues
        jsonStr = jsonStr
          .replace(/,\s*}/g, '}')
          .replace(/([{,]\s*)"?(\w+)"?\s*:/g, '$1"$2":')
          .replace(/:\s*'([^']*)'/g, ':"$1"');

        try {
          parsedResponse = JSON.parse(jsonStr);
        } catch (finalError) {
          llmLogger.log({
            timestamp: new Date().toISOString(),
            provider: 'azure',
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
        provider: 'azure',
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
        provider: 'azure',
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
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0].message?.content?.trim() || '';

      const chatResponse: ChatResponse = {
        content,
        usage: {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        }
      };

      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: 'azure',
        prompt: messages[messages.length - 1].content,
        response: chatResponse,
        duration: Date.now() - startTime,
        success: true,
        level: 'info'
      });

      return chatResponse;
    } catch (error) {
      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: 'azure',
        prompt: messages[messages.length - 1].content,
        error,
        duration: Date.now() - startTime,
        success: false,
        level: 'error'
      });
      throw error;
    }
  }
}
