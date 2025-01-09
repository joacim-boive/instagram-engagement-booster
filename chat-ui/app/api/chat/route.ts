import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserSettings } from '@/services/settingsService';
import { LangChainService } from '@/services/langchainService';
import { serverEnv } from '@/config/server-env';
import { usageService } from '@/services/usageService';
import { getCurrentModel } from '@/lib/utils/model';
import { checkTokenLimit } from '@/lib/utils/token-limits';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Singleton instance of LangChainService to reuse across requests
let langChainService: LangChainService | null = null;

async function ensureUser(userId: string, userEmail: string | null) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      await prisma.user.create({
        data: {
          id: userId,
          email: userEmail || userId,
          subscriptionTier: 'FREE',
          monthlyTokens: serverEnv.freeTierTokens,
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const startTime = Date.now();

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

    // Get user details
    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress || null;

    // Ensure user exists in database
    await ensureUser(userId, userEmail);

    // Check token limit before proceeding
    const { canUseTokens, currentUsage, limit, remainingTokens } =
      await checkTokenLimit(userId);

    if (!canUseTokens) {
      return NextResponse.json(
        {
          error: 'Token limit exceeded',
          tokenStatus: {
            canUseTokens,
            currentUsage,
            limit,
            remainingTokens,
          },
        },
        { status: 429 }
      );
    }

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

    let totalTokens = 0;

    console.log('Chat API: Starting streaming response');
    // Start generating the response in the background
    langChainService
      .streamingChat(message, async (token: string) => {
        // Check if adding this token would exceed the limit
        if (totalTokens + token.length > remainingTokens) {
          console.log('Chat API: Token limit reached during generation');
          await writer.write(
            encoder.encode(
              JSON.stringify({
                error: 'Token limit exceeded',
                tokenStatus: {
                  canUseTokens: false,
                  currentUsage: currentUsage + totalTokens,
                  limit,
                  remainingTokens: 0,
                },
              }) + '\n'
            )
          );
          writer.close();
          return;
        }
        totalTokens += token.length;
        await writer.write(encoder.encode(JSON.stringify({ token }) + '\n'));
      })
      .then(async () => {
        console.log('Chat API: Streaming completed');
        writer.close();

        // Log usage statistics
        const responseTime = Date.now() - startTime;
        await usageService.logUsage({
          userId,
          model: getCurrentModel(settings),
          tokens: totalTokens,
          responseTime,
          success: true,
        });
      })
      .catch(async err => {
        console.error('Chat API: Streaming error:', err);
        if (err.message === 'Token limit reached during generation') {
          // Already handled above
          return;
        }
        writer.abort(err);

        // Log failed attempt
        const responseTime = Date.now() - startTime;
        await usageService.logUsage({
          userId,
          model: getCurrentModel(settings),
          tokens: totalTokens,
          responseTime,
          success: false,
          error: err.message,
        });
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

    // Log error
    const responseTime = Date.now() - startTime;
    await usageService.logUsage({
      userId: (await auth())?.userId || 'unknown',
      model: 'unknown',
      tokens: 0,
      responseTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
