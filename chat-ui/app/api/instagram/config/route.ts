import { auth } from '@clerk/nextjs/server';
import { UserService } from '@/services/userService';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user = await UserService.getCurrentUser();
  if (!user) {
    return new NextResponse('User not found', { status: 404 });
  }

  return NextResponse.json(user);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const data = await request.json();
  const { instagramHandle, accessToken } = data;

  if (!instagramHandle || !accessToken) {
    return new NextResponse('Missing required fields', { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      instagramHandle,
      instagramAccessToken: accessToken,
    },
  });

  return new NextResponse('Config updated', { status: 200 });
}
