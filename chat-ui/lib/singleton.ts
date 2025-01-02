import { AiService } from '@/services/aiService';
import { env } from '../app/config/env';

// Declare the global type
declare global {
  // eslint-disable-next-line no-var
  var aiService: AiService | undefined;
}

// Configure AI providers
const config = {
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

// Use globalThis to persist across reloads in development
export function getAiService(): AiService {
  if (!globalThis.aiService) {
    globalThis.aiService = new AiService(config);
  }
  return globalThis.aiService;
}

// Initialize on import
if (!globalThis.aiService) {
  console.log('Creating new AiService instance...');
  globalThis.aiService = new AiService(config);
  void globalThis.aiService.initializeVectorStore();
}
