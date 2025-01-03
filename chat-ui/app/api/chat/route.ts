import { NextResponse } from 'next/server';
import { getAiService } from '@/lib/singleton';
import { auth } from '@clerk/nextjs/server';
import { getUserSettings } from '@/services/settingsService';
import { env } from '../../config/env';
import type { ProviderConfig } from '@/services/ai/types';

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user settings and AI service
    const [userSettings, aiService] = await Promise.all([
      getUserSettings(),
      getAiService(),
    ]);

    // Configure the service with user settings if available
    if (userSettings[0]) {
      const settings = userSettings[0];
      const config: ProviderConfig = {
        openai:
          settings.aiProvider === 'openai' &&
          (settings.openaiApiKey || env.openaiApiKey)
            ? {
                apiKey: (settings.openaiApiKey || env.openaiApiKey)!,
                model: settings.openaiModel || env.openaiModel,
              }
            : undefined,
        anthropic:
          settings.aiProvider === 'anthropic' &&
          (settings.anthropicApiKey || env.anthropicApiKey)
            ? {
                apiKey: (settings.anthropicApiKey || env.anthropicApiKey)!,
                model: settings.anthropicModel || env.anthropicModel,
              }
            : undefined,
      };

      aiService.updateConfig(config, settings.systemPrompt);

      console.log('Applied user configuration:', {
        provider: settings.aiProvider,
        model:
          settings.aiProvider === 'openai'
            ? settings.openaiModel || env.openaiModel
            : settings.anthropicModel || env.anthropicModel,
        usingCustomKey:
          settings.aiProvider === 'openai'
            ? !!settings.openaiApiKey
            : !!settings.anthropicApiKey,
        systemPrompt: settings.systemPrompt || 'using default system prompt',
      });
    }

    // Create a TransformStream for streaming the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start generating the response in the background
    aiService
      .generateStreamingResponse(message, async (token: string) => {
        await writer.write(encoder.encode(JSON.stringify({ token }) + '\n'));
      })
      .then(() => writer.close())
      .catch(error => {
        console.error('Streaming error:', error);
        writer.abort(error);
      });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
