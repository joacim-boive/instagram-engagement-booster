import { NextResponse } from 'next/server';

const clientId = process.env.META_CLIENT_ID;
const redirectUri =
  process.env.META_REDIRECT_URI ||
  'http://localhost:3000/api/auth/meta/callback';
const scopes = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_read_engagement',
  'pages_manage_metadata',
  'pages_show_list',
  'pages_manage_engagement',
  'pages_manage_posts',
];

export async function POST() {
  try {
    const authUrl = `https://facebook.com/v21.0/dialog/oauth?${new URLSearchParams(
      {
        client_id: clientId!,
        redirect_uri: redirectUri,
        scope: scopes.join(','),
        response_type: 'code',
      }
    )}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Meta auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Meta authentication' },
      { status: 500 }
    );
  }
}
