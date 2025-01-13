import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkTokenLimit } from './token-limits';
import { mockClerkUser } from '../../tests/mocks/clerk';
import { prisma } from '@/lib/prisma';
import {
  createMockUser,
  createMockAggregateResult,
} from '../../tests/utils/prisma-utils';

// Mock Prisma
vi.mock('@/lib/prisma');

// Mock Clerk's server auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: mockClerkUser.id })),
  currentUser: vi.fn(() => Promise.resolve(mockClerkUser)),
}));

describe('checkTokenLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct usage stats for user under limit', async () => {
    const mockUser = createMockUser({
      id: mockClerkUser.id,
      monthlyTokens: 100,
    });
    const mockUsage = createMockAggregateResult(30);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.usageLog.aggregate).mockResolvedValue(mockUsage);

    const result = await checkTokenLimit(mockClerkUser.id);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockClerkUser.id },
    });

    expect(result).toEqual({
      canUseTokens: true,
      currentUsage: 30,
      limit: 100,
      remainingTokens: 70,
      isNearLimit: false,
      usagePercentage: 30,
    });
  });

  it('should return correct stats for user near limit', async () => {
    const mockUser = createMockUser({
      id: mockClerkUser.id,
      monthlyTokens: 100,
    });
    const mockUsage = createMockAggregateResult(85); // 85% usage

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.usageLog.aggregate).mockResolvedValue(mockUsage);

    const result = await checkTokenLimit(mockClerkUser.id);

    expect(result).toEqual({
      canUseTokens: true,
      currentUsage: 85,
      limit: 100,
      remainingTokens: 15,
      isNearLimit: true,
      usagePercentage: 85,
    });
  });

  it('should return correct stats for user at limit', async () => {
    const mockUser = createMockUser({
      id: mockClerkUser.id,
      monthlyTokens: 100,
    });
    const mockUsage = createMockAggregateResult(100);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.usageLog.aggregate).mockResolvedValue(mockUsage);

    const result = await checkTokenLimit(mockClerkUser.id);

    expect(result).toEqual({
      canUseTokens: false,
      currentUsage: 100,
      limit: 100,
      remainingTokens: 0,
      isNearLimit: true,
      usagePercentage: 100,
    });
  });

  it('should throw error when user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(checkTokenLimit(mockClerkUser.id)).rejects.toThrow(
      'User not found'
    );
  });
});
