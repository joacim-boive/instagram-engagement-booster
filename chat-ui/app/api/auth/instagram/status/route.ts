import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserService } from '@/services/userService';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ensure user exists in database
    await UserService.ensureUser();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        instagramPageId: true,
        instagramAccessToken: true,
        instagramHandle: true,
      },
    });

    return NextResponse.json({
      connected: !!(user?.instagramPageId && user?.instagramAccessToken),
      pageId: user?.instagramPageId,
      handle: user?.instagramHandle,
    });
  } catch (error) {
    console.error('Error checking Instagram status:', error);
    return NextResponse.json(
      { error: 'Failed to check Instagram status' },
      { status: 500 }
    );
  }
}
