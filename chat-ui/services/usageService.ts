import { prisma } from '@/lib/prisma';

type UsageLog = NonNullable<
  Awaited<ReturnType<typeof prisma.usageLog.findUnique>>
>;

export const usageService = {
  logUsage: async ({
    userId,
    model,
    tokens,
    responseTime,
    success,
    error,
  }: {
    userId: string;
    model: string;
    tokens: number;
    responseTime: number;
    success: boolean;
    error?: string;
  }) => {
    const log = await prisma.usageLog.create({
      data: {
        userId,
        model,
        tokens,
        responseTime,
        success,
        error,
      },
    });
    console.log('Usage logged:', log);
  },

  getStats: async (userId?: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all relevant logs
    const logs = await prisma.usageLog.findMany({
      where: userId
        ? {
            userId,
            timestamp: { gte: thirtyDaysAgo },
          }
        : {
            timestamp: { gte: thirtyDaysAgo },
          },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Calculate usage by date
    const usageByDate = new Map<string, number>();
    logs.forEach((log: UsageLog) => {
      const date = log.timestamp.toISOString().split('T')[0];
      usageByDate.set(date, (usageByDate.get(date) || 0) + log.tokens);
    });

    // Calculate model distribution
    const modelUsage = new Map<string, number>();
    logs.forEach((log: UsageLog) => {
      modelUsage.set(log.model, (modelUsage.get(log.model) || 0) + 1);
    });

    const totalRequests = logs.length;
    const successfulRequests = logs.filter(
      (log: UsageLog) => log.success
    ).length;

    return {
      totalTokens: logs.reduce(
        (sum: number, log: UsageLog) => sum + log.tokens,
        0
      ),
      totalConversations: totalRequests,
      averageResponseTime:
        logs.reduce((sum: number, log: UsageLog) => sum + log.responseTime, 0) /
          totalRequests || 0,
      successRate: (successfulRequests / totalRequests) * 100 || 0,
      usageOverTime: Array.from(usageByDate.entries()).map(
        ([date, tokens]) => ({
          date,
          tokens,
        })
      ),
      modelDistribution: Array.from(modelUsage.entries()).map(
        ([name, usage]) => ({
          name,
          usage: (usage / totalRequests) * 100,
        })
      ),
    };
  },
};
