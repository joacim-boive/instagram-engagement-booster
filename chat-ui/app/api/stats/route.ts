import { NextResponse } from 'next/server';

type UsageData = {
  date: string;
  tokens: number;
};

// This will be replaced with real database queries later
const mockUsageData: UsageData[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0],
  tokens: Math.floor(Math.random() * 10000),
})).reverse();

export type StatsResponse = {
  totalTokens: number;
  totalConversations: number;
  averageResponseTime: number;
  successRate: number;
  usageOverTime: UsageData[];
  modelDistribution: {
    name: string;
    usage: number;
  }[];
};

export async function GET() {
  try {
    // This will be replaced with real data fetching logic
    const mockStats: StatsResponse = {
      totalTokens: mockUsageData.reduce((acc, curr) => acc + curr.tokens, 0),
      totalConversations: 150,
      averageResponseTime: 800,
      successRate: 98.5,
      usageOverTime: mockUsageData,
      modelDistribution: [
        { name: 'GPT-4', usage: 45 },
        { name: 'GPT-3.5', usage: 35 },
        { name: 'Claude', usage: 20 },
      ],
    };

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
