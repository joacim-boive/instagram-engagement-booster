import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { usageService } from '@/services/usageService';
import { UserService } from '@/services/userService';

export type StatsResponse = Awaited<ReturnType<typeof usageService.getStats>>;

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Ensure user exists in database
    await UserService.ensureUser();

    const stats = await usageService.getStats(userId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
