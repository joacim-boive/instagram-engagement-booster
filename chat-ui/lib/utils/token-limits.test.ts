import { describe, it, expect, vi } from 'vitest';
import { checkTokenLimit } from './token-limits';
import { setupPrismaTest } from '../../tests/utils/test-setup';
import {
  createMockUser,
  createMockAggregateResult,
} from '../../tests/utils/prisma-utils';

vi.mock('@/lib/prisma');

describe('checkTokenLimit', () => {
  const { prisma } = setupPrismaTest();

  it('should return correct usage stats for user under limit', async () => {
    const mockUser = createMockUser();
    const mockUsage = createMockAggregateResult(30);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.usageLog.aggregate).mockResolvedValue(mockUsage);

    const result = await checkTokenLimit('test-user');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-user' },
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

  it('should throw error when user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(checkTokenLimit('non-existent-user')).rejects.toThrow(
      'User not found'
    );
  });
});
