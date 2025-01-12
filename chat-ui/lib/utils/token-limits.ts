import { prisma } from '@/lib/prisma';

const WARNING_THRESHOLD = 0.8; // 80% of limit

export async function checkTokenLimit(userId: string): Promise<{
  canUseTokens: boolean;
  currentUsage: number;
  limit: number;
  remainingTokens: number;
  isNearLimit: boolean;
  usagePercentage: number;
}> {
  // Get user's current tier and limits
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate current month's usage
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
  const canUseTokens = currentUsage < limit;
  const isNearLimit = usagePercentage >= WARNING_THRESHOLD * 100;

  return {
    canUseTokens,
    currentUsage,
    limit,
    remainingTokens,
    isNearLimit,
    usagePercentage,
  };
}
