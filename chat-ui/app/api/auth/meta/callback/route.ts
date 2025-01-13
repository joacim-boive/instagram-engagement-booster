import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { auth } from '@clerk/nextjs/server';
import { getMetaPageId, setMetaPageId } from '../shared';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    // For Meta auth, we don't always need the state parameter
    const state = searchParams.get('state');

    console.log('Auth params:', { code, state, userId });

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    // If state is present and starts with instagram_, use it for Instagram flow
    const isInstagram = state?.startsWith('instagram_');
    const actualUserId =
      isInstagram && state ? state.replace('instagram_', '') : userId;

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

    const page = pagesResponse.data.data[0];
    if (!page?.id) {
      console.error('No page ID found in response');
      throw new Error('No page ID found');
    }

    if (isInstagram) {
      // Get Instagram business account ID for the page
      const pageResponse = await axios.get(
        `https://graph.facebook.com/v21.0/${page.id}`,
        {
          params: {
            fields: 'instagram_business_account',
            access_token: page.access_token,
          },
        }
      );

      const instagramAccountId =
        pageResponse.data?.instagram_business_account?.id;
      if (!instagramAccountId) {
        return new NextResponse('No Instagram business account found', {
          status: 400,
        });
      }

      // Store Instagram info
      await prisma.user.update({
        where: { id: actualUserId },
        data: {
          instagramAccessToken: page.access_token,
        },
      });

      return new Response(
        '<script>window.opener.postMessage("instagram_success", "*"); window.close();</script>',
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    } else {
      // Regular Meta auth flow
      setMetaPageId(page.id);
      return new Response('<script>window.close();</script>', {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  } catch (error) {
    console.error('Error in Meta callback:', error);
    return new Response(
      '<script>window.opener.postMessage("auth_error", "*"); window.close();</script>',
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

export async function POST() {
  return NextResponse.json({ pageId: getMetaPageId() });
}
