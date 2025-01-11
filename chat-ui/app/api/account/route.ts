import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserService } from '@/services/userService';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in database
    await UserService.ensureUser();

    // Get user's token usage for the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user and their subscription info
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get total token usage for the current month
    const tokenUsage = await prisma.usageLog.aggregate({
      where: {
        userId,
        timestamp: {
          gte: startOfMonth,
        },
      },
      _sum: {
        tokens: true,
      },
    });

    return NextResponse.json({
      subscriptionTier: user.subscriptionTier,
      tokenStatus: {
        currentUsage: tokenUsage._sum.tokens || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching account info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account information' },
      { status: 500 }
    );
  }
}
