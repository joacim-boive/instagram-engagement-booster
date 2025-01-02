import { NextResponse } from 'next/server';
import { getAiService } from '@/lib/singleton';

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const aiService = getAiService();

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
