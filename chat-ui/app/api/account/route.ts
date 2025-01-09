import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const DEFAULT_TIER = {
  name: 'FREE',
  monthlyTokens: 100,
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // For now, return default tier info for all users
    // TODO: Implement actual tier management
    const currentUsage = 0; // For new users, start with 0
    const limit = DEFAULT_TIER.monthlyTokens;
    const remainingTokens = limit - currentUsage;
    const usagePercentage = (currentUsage / limit) * 100;
    const isNearLimit = usagePercentage >= 80;

    return NextResponse.json({
      subscriptionTier: DEFAULT_TIER.name,
      monthlyTokens: DEFAULT_TIER.monthlyTokens,
      tokenStatus: {
        canUseTokens: true,
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
