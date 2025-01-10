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
        instagramPageId: true,
        instagramAccessToken: true,
      },
    });

    return NextResponse.json({
      connected: !!(user?.instagramPageId && user?.instagramAccessToken),
      pageId: user?.instagramPageId,
    });
  } catch (error) {
    console.error('Error checking Instagram status:', error);
    return NextResponse.json(
      { error: 'Failed to check Instagram status' },
      { status: 500 }
    );
  }
}
