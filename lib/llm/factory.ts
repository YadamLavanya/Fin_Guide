import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GeminiProvider } from './providers/gemini';
import { CohereProvider } from './providers/cohere';
import { GroqProvider } from './providers/groq';
import { OllamaProvider } from './providers/ollama';
import { MistralProvider } from './providers/mistral';
import type { LLMProvider, LLMCapabilities } from './types';

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
  mode?: 'insights' | 'chat';
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

const PROVIDER_CAPABILITIES: Record<SupportedProvider, LLMCapabilities> = {
  openai: {
    supportsChat: true,
    supportsInsights: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxTokens: 8192
  },
  anthropic: {
    supportsChat: true,
    supportsInsights: true,
    supportsFunctionCalling: false,
    supportsStreaming: true,
    maxTokens: 100000
  },
  gemini: {
    supportsChat: true,
    supportsInsights: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxTokens: 32768
  },
  cohere: {
    supportsChat: false,
    supportsInsights: true,
    supportsFunctionCalling: false,
    supportsStreaming: false,
    maxTokens: 4096
  },
  groq: {
    supportsChat: true,
    supportsInsights: true,
    supportsFunctionCalling: false,
    supportsStreaming: true,
    maxTokens: 32768
  },
  ollama: {
    supportsChat: true,
    supportsInsights: true,
    supportsFunctionCalling: false,
    supportsStreaming: true,
    maxTokens: 4096
  },
  mistral: {
    supportsChat: true,
    supportsInsights: true,
    supportsFunctionCalling: false,
    supportsStreaming: true,
    maxTokens: 32768
  }
};

export function getProviderCapabilities(providerName: SupportedProvider): LLMCapabilities {
  return PROVIDER_CAPABILITIES[providerName];
}

export function createLLMProvider(
  providerName: SupportedProvider,
  config: ProviderConfig
): LLMProvider {
  const Provider = providers[providerName];
  if (!Provider) throw new Error(`Unsupported provider: ${providerName}`);

  const capabilities = PROVIDER_CAPABILITIES[providerName];
  const mode = config.mode || 'insights';

  // Validate provider capabilities against requested mode
  if (mode === 'chat' && !capabilities.supportsChat) {
    throw new Error(`Provider ${providerName} does not support chat mode`);
  }
  if (mode === 'insights' && !capabilities.supportsInsights) {
    throw new Error(`Provider ${providerName} does not support insights mode`);
  }

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
