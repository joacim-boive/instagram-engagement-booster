import type { User, UsageLog } from '@prisma/client';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user',
  email: 'test@example.com',
  monthlyTokens: 100,
  subscriptionTier: 'FREE',
  currentPeriodEnd: null,
  subscriptionId: null,
  instagramHandle: null,
  instagramAccessToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUsageLog = (
  overrides: Partial<UsageLog> = {}
): UsageLog => ({
  id: 'test-log',
  userId: 'test-user',
  timestamp: new Date(),
  model: 'test-model',
  tokens: 30,
  responseTime: 100,
  success: true,
  error: null,
  createdAt: new Date(),
  ...overrides,
});

export const createMockAggregateResult = (tokens: number = 30) => ({
  _sum: {
    tokens,
  },
  _count: {},
  _avg: {},
  _min: {},
  _max: {},
});
