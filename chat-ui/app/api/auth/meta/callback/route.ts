import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { auth } from '@clerk/nextjs/server';
import { getMetaPageId, setMetaPageId } from '../shared';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await axios.get(
      'https://graph.facebook.com/v21.0/oauth/access_token',
      {
        params: {
          client_id: process.env.META_CLIENT_ID,
          client_secret: process.env.META_CLIENT_SECRET,
          redirect_uri:
            process.env.META_REDIRECT_URI ||
            'http://localhost:3000/api/auth/meta/callback',
          code,
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // Get long-lived token
    const longLivedTokenResponse = await axios.get(
      'https://graph.facebook.com/v21.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.META_CLIENT_ID,
          client_secret: process.env.META_CLIENT_SECRET,
          fb_exchange_token: access_token,
        },
      }
    );

    const longLivedToken = longLivedTokenResponse.data.access_token;

    // Get user's pages
    const pagesResponse = await axios.get(
      'https://graph.facebook.com/v21.0/me/accounts',
      {
        params: {
          access_token: longLivedToken,
        },
      }
    );

    console.log('Pages response:', pagesResponse.data);

    const pageId = pagesResponse.data.data[0]?.id;
    if (!pageId) {
      console.error('No page ID found in response');
      throw new Error('No page ID found');
    }

    // Store in shared state
    console.log('Setting page ID:', pageId);
    setMetaPageId(pageId);

    return new Response('<script>window.close();</script>', {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error in Meta callback:', error);
    return new Response('<script>window.close();</script>', {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}

export async function POST() {
  return NextResponse.json({ pageId: getMetaPageId() });
}
