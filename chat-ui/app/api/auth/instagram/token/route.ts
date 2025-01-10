import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        instagramAccessToken: true,
      },
    });

    if (!user?.instagramAccessToken) {
      return NextResponse.json(
        { error: 'Instagram access token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      accessToken: user.instagramAccessToken,
    });
  } catch (error) {
    console.error('Error fetching Instagram access token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram access token' },
      { status: 500 }
    );
  }
}
