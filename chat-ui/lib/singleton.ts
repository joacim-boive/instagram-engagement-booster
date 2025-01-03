import { AiService } from '@/services/aiService';
import { env } from '../app/config/env';
import type { ProviderConfig } from '@/services/ai/types';

// Declare the global type
declare global {
  // eslint-disable-next-line no-var
  var aiService: AiService | undefined;
  // eslint-disable-next-line no-var
  var initPromise: Promise<void> | undefined;
}

// Get default config
function getDefaultConfig(): ProviderConfig {
  return {
    openai: env.openaiApiKey
      ? {
          apiKey: env.openaiApiKey,
          model: env.openaiModel,
        }
      : undefined,
    anthropic: env.anthropicApiKey
      ? {
          apiKey: env.anthropicApiKey,
          model: env.anthropicModel,
        }
      : undefined,
  };
}

// Initialize the AI service
async function initializeAiService() {
  if (!globalThis.aiService) {
    console.log('Creating new AiService instance with default config...');
    const config = getDefaultConfig();
    console.log('Using configuration:', {
      provider: config.openai ? 'openai' : 'anthropic',
      model: config.openai?.model || config.anthropic?.model,
      usingCustomKey: false,
      systemPrompt: 'using default system prompt',
    });
    globalThis.aiService = new AiService(config);
    await globalThis.aiService.initializeVectorStore();
  }
}

// Use globalThis to persist across reloads in development
export async function getAiService(): Promise<AiService> {
  // Wait for initialization if it's in progress
  if (globalThis.initPromise) {
    await globalThis.initPromise;
  }

  // Initialize if not already done
  if (!globalThis.aiService) {
    globalThis.initPromise = initializeAiService();
    await globalThis.initPromise;
  }

  return globalThis.aiService!;
}

// Start initialization on import
if (!globalThis.initPromise) {
  globalThis.initPromise = initializeAiService();
}
