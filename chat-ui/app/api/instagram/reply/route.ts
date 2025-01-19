import { NextResponse } from 'next/server';
import { z } from 'zod';

const replySchema = z.object({
  postId: z.string(),
  commentId: z.string(),
  response: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, commentId, response } = replySchema.parse(body);

    // TODO: Implement actual Instagram API integration
    // This is a placeholder that simulates a successful response
    // You'll need to implement the actual Instagram API call here

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error posting comment reply:', error);
    return NextResponse.json(
      { error: 'Failed to post comment reply' },
      { status: 500 }
    );
  }
}
