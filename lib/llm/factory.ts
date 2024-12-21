import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GeminiProvider } from './providers/gemini';
import { CohereProvider } from './providers/cohere';
import { GroqProvider } from './providers/groq';
import { OllamaProvider } from './providers/ollama';
import { MistralProvider } from './providers/mistral';
import type { LLMProvider } from './types';

const providers = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  gemini: GeminiProvider,
  cohere: CohereProvider,
  groq: GroqProvider,
  ollama: OllamaProvider,
  mistral: MistralProvider
} as const;

export type SupportedProvider = keyof typeof providers;

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  customModel?: string;
  contextLength?: number;
  temperature?: number;
}

const DEFAULT_CONFIGS: Record<SupportedProvider, Partial<ProviderConfig>> = {
  openai: { model: 'gpt-4' },
  anthropic: { model: 'claude-2' },
  gemini: { model: 'gemini-pro' },
  cohere: { model: 'command' },
  groq: { model: 'mixtral-8x7b-32768' },
  ollama: { 
    baseUrl: 'http://localhost:11434', 
    model: 'llama2',
    contextLength: 4096,
    temperature: 0.7
  },
  mistral: { model: 'mistral-medium' }
};

export function createLLMProvider(
  providerName: SupportedProvider,
  config: ProviderConfig
): LLMProvider {
  const Provider = providers[providerName];
  if (!Provider) throw new Error(`Unsupported provider: ${providerName}`);

  // Special handling for Ollama's customModel
  if (providerName === 'ollama' && config.customModel) {
    config.model = config.customModel;
  }

  const finalConfig = {
    ...DEFAULT_CONFIGS[providerName],
    ...config
  };

  // Only check for API key if provider requires it
  if (!finalConfig.apiKey && providerName !== 'ollama') {
    throw new Error(`API key required for ${providerName}`);
  }

  return new Provider(finalConfig);
}
