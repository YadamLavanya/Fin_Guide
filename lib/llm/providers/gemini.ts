import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, TransactionData, InsightData, ChatMessage, ChatResponse } from '../types';
import { generateLLMPrompt } from '../utils';
import { llmLogger } from '../logging';
import type { ProviderConfig } from '../factory';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Google API key is required');
    }
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-pro';
  }

  async analyze(data: TransactionData): Promise<InsightData> {
    const startTime = Date.now();
    const prompt = generateLLMPrompt(data);

    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      const generatedText = result.response.text().trim();
      
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
            provider: 'gemini',
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
        provider: 'gemini',
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
        provider: 'gemini',
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
      const model = this.client.getGenerativeModel({ model: this.model });
      const response = await model.generateContent({
        contents: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      const content = response.response.text().trim();

      const chatResponse: ChatResponse = {
        content,
        usage: {
          prompt_tokens: undefined,
          completion_tokens: undefined,
          total_tokens: undefined
        }
      };

      llmLogger.log({
        timestamp: new Date().toISOString(),
        provider: 'gemini',
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
        provider: 'gemini',
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
// TODO: Implement the GeminiProvider class