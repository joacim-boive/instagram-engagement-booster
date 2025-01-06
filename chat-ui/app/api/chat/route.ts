import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserSettings } from '@/services/settingsService';
import { LangChainService } from '@/services/langchainService';
import { serverEnv } from '@/config/server-env';

// Singleton instance of LangChainService to reuse across requests
let langChainService: LangChainService | null = null;

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  try {
    console.log('Chat API: Received request');
    console.log('Chat API: Server environment:', {
      hasOpenAIKey: !!serverEnv.openaiApiKey,
      openAIModel: serverEnv.openaiModel,
      hasAnthropicKey: !!serverEnv.anthropicApiKey,
      anthropicModel: serverEnv.anthropicModel,
    });

    // Ensure user is authenticated
    const { userId } = await auth();
    if (!userId) {
      console.log('Chat API: Unauthorized - no userId');
      return new Response('Unauthorized', { status: 401 });
    }
    console.log('Chat API: Authenticated user:', userId);

    // Validate request body
    const body = await request.json();
    console.log('Chat API: Request body:', body);
    const { message } = body;
    if (!message) {
      console.log('Chat API: Missing message in request');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user settings and initialize or update LangChain service
    const settings = await getUserSettings();
    console.log('Chat API: Retrieved settings:', settings);

    if (!settings?.facebookPageId) {
      console.log('Chat API: Missing required Facebook Page ID');
      return NextResponse.json(
        { error: 'Facebook Page ID is required in settings' },
        { status: 400 }
      );
    }

    // Initialize or update LangChain service with current settings
    if (!langChainService) {
      console.log('Chat API: Initializing new LangChain service');
      langChainService = new LangChainService(settings);
    } else {
      console.log('Chat API: Updating existing LangChain service');
      langChainService.updateConfig(settings);
    }

    // Create a TransformStream for streaming the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    console.log('Chat API: Starting streaming response');
    // Start generating the response in the background
    langChainService
      .streamingChat(message, async (token: string) => {
        await writer.write(encoder.encode(JSON.stringify({ token }) + '\n'));
      })
      .then(() => {
        console.log('Chat API: Streaming completed');
        writer.close();
      })
      .catch(error => {
        console.error('Chat API: Streaming error:', error);
        writer.abort(error);
      });

    console.log('Chat API: Returning stream response');
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
