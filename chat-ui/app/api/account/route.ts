import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the user's data from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Account API: Retrieved user data:', user);

    // Get the user's current usage from the database
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const currentMonthUsage = await prisma.usageLog.aggregate({
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

    const currentUsage = currentMonthUsage._sum.tokens || 0;
    const limit = user.monthlyTokens;
    const remainingTokens = Math.max(0, limit - currentUsage);
    const usagePercentage = (currentUsage / limit) * 100;
    const isNearLimit = usagePercentage >= 80;

    console.log('Account API: Calculated token status:', {
      currentUsage,
      limit,
      remainingTokens,
      usagePercentage,
      isNearLimit,
    });

    return NextResponse.json({
      subscriptionTier: user.subscriptionTier,
      monthlyTokens: user.monthlyTokens,
      currentPeriodEnd: user.currentPeriodEnd,
      tokenStatus: {
        canUseTokens: currentUsage < limit,
        currentUsage,
        limit,
        remainingTokens,
        isNearLimit,
        usagePercentage,
      },
    });
  } catch (error) {
    console.error('Error fetching account info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
