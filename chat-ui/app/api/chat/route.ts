import { NextResponse } from 'next/server';
import { AiService } from '@/services/aiService';
import { ProviderConfig } from '@/services/ai/types';
import { env } from '../../config/env';

// Configure AI provider based on environment variables
const config: ProviderConfig = {};

if (env.openaiApiKey) {
  config.openai = {
    apiKey: env.openaiApiKey,
    model: env.openaiModel
  };
} else if (env.anthropicApiKey) {
  config.anthropic = {
    apiKey: env.anthropicApiKey,
    model: env.anthropicModel
  };
}

const aiService = new AiService(config);

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await aiService.generateResponse(message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 