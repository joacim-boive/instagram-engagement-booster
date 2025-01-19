import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConfigService } from '@/services/configService';

type InstagramReply = {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  from?: {
    id: string;
  };
};

type InstagramComment = {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  from?: {
    id: string;
  };
  replies?: {
    data: InstagramReply[];
  };
};

type InstagramPost = {
  id: string;
  caption?: string;
  media_url: string;
  timestamp: string;
  comments?: {
    data: InstagramComment[];
  };
};

type InstagramResponse = {
  data: InstagramPost[];
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Instagram credentials
    const config = await ConfigService.getInstagramConfig();
    if (!config?.accessToken) {
      return NextResponse.json({
        error: 'Instagram access token not configured',
        posts: [],
      });
    }

    // Fetch posts from Instagram Graph API
    const response = await fetch(`https://graph.facebook.com/v21.0/me/media`, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Instagram API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch Instagram posts', posts: [] },
        { status: response.status }
      );
    }

    const data = (await response.json()) as InstagramResponse;
    const posts = data.data.map(post => ({
      id: post.id,
      caption: post.caption || '',
      mediaUrl: post.media_url,
      timestamp: post.timestamp,
      comments:
        post.comments?.data.map(comment => ({
          id: comment.id,
          username: comment.username,
          text: comment.text,
          timestamp: comment.timestamp,
          isFromPage: comment.from?.id === config.instagramHandle,
          replies:
            comment.replies?.data.map(reply => ({
              id: reply.id,
              username: reply.username,
              text: reply.text,
              timestamp: reply.timestamp,
              isFromPage: reply.from?.id === config.instagramHandle,
            })) || [],
        })) || [],
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram posts', posts: [] },
      { status: 500 }
    );
  }
}
