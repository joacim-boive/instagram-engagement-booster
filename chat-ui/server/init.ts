import { AiService } from '@/services/aiService';
import { env } from '../app/config/env';

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

// Create and export a singleton instance
export const aiService = new AiService(config);

// Initialize immediately
const initServer = async () => {
  try {
    console.log('Initializing AI service...');
    await aiService.initializeVectorStore();
    console.log('AI service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AI service:', error);
    // You might want to throw here depending on your error handling strategy
  }
};

// Run initialization
void initServer();
