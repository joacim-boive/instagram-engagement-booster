import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserService } from '@/services/userService';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ensure user exists in database
    await UserService.ensureUser();

    const body = await request.json().catch(() => null);
    if (!body || !body.handle) {
      return new NextResponse('Instagram handle is required', { status: 400 });
    }

    const { handle } = body;

    // Store the handle temporarily
    await prisma.user.update({
      where: { id: userId },
      data: {
        instagramHandle: handle,
      },
    });

    // Use the same Meta OAuth URL but with Instagram-specific state
    const clientId = process.env.META_CLIENT_ID;
    const redirectUri = process.env.META_REDIRECT_URI;
    const scope =
      'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';

    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=instagram_${userId}`;

    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error('Error initiating Instagram connection:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Instagram connection' },
      { status: 500 }
    );
  }
}
