import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usageService } from './usageService';
import { mockClerkUser } from '../tests/mocks/clerk';
import { prisma } from '@/lib/prisma';
import { createMockUsageLog } from '../tests/utils/prisma-utils';

// Mock Prisma
vi.mock('@/lib/prisma');

// Mock Clerk's server auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: mockClerkUser.id })),
  currentUser: vi.fn(() => Promise.resolve(mockClerkUser)),
}));

describe('usageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logUsage', () => {
    it('should create usage log entry', async () => {
      const mockLog = createMockUsageLog({
        userId: mockClerkUser.id,
        model: 'gpt-4',
        tokens: 150,
        responseTime: 2000,
        success: true,
      });

      vi.mocked(prisma.usageLog.create).mockResolvedValue(mockLog);

      await usageService.logUsage({
        userId: mockClerkUser.id,
        model: 'gpt-4',
        tokens: 150,
        responseTime: 2000,
        success: true,
      });

      expect(prisma.usageLog.create).toHaveBeenCalledWith({
        data: {
          userId: mockClerkUser.id,
          model: 'gpt-4',
          tokens: 150,
          responseTime: 2000,
          success: true,
          error: undefined,
        },
      });
    });

    it('should handle error logging', async () => {
      const mockLog = createMockUsageLog({
        userId: mockClerkUser.id,
        model: 'gpt-4',
        tokens: 0,
        responseTime: 1000,
        success: false,
        error: 'API Error',
      });

      vi.mocked(prisma.usageLog.create).mockResolvedValue(mockLog);

      await usageService.logUsage({
        userId: mockClerkUser.id,
        model: 'gpt-4',
        tokens: 0,
        responseTime: 1000,
        success: false,
        error: 'API Error',
      });

      expect(prisma.usageLog.create).toHaveBeenCalledWith({
        data: {
          userId: mockClerkUser.id,
          model: 'gpt-4',
          tokens: 0,
          responseTime: 1000,
          success: false,
          error: 'API Error',
        },
      });
    });
  });

  describe('getStats', () => {
    it('should return usage statistics for specific user', async () => {
      const mockLogs = [
        createMockUsageLog({
          userId: mockClerkUser.id,
          tokens: 100,
          responseTime: 1000,
          success: true,
          timestamp: new Date('2024-01-01'),
        }),
        createMockUsageLog({
          userId: mockClerkUser.id,
          tokens: 200,
          responseTime: 2000,
          success: true,
          timestamp: new Date('2024-01-02'),
        }),
      ];

      vi.mocked(prisma.usageLog.findMany).mockResolvedValue(mockLogs);

      const stats = await usageService.getStats(mockClerkUser.id);

      expect(stats).toEqual({
        totalTokens: 300,
        totalConversations: 2,
        averageResponseTime: 1500,
        successRate: 100,
        usageOverTime: [
          { date: '2024-01-01', tokens: 100 },
          { date: '2024-01-02', tokens: 200 },
        ],
        modelDistribution: [{ name: 'test-model', usage: 100 }],
      });

      expect(prisma.usageLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockClerkUser.id,
          timestamp: expect.any(Object),
        },
        orderBy: {
          timestamp: 'asc',
        },
      });
    });

    it('should return global usage statistics when no user specified', async () => {
      const mockLogs = [
        createMockUsageLog({
          userId: 'user-1',
          tokens: 100,
          model: 'gpt-4',
        }),
        createMockUsageLog({
          userId: 'user-2',
          tokens: 200,
          model: 'claude',
        }),
      ];

      vi.mocked(prisma.usageLog.findMany).mockResolvedValue(mockLogs);

      const stats = await usageService.getStats();

      expect(stats.totalTokens).toBe(300);
      expect(stats.modelDistribution).toEqual([
        { name: 'gpt-4', usage: 50 },
        { name: 'claude', usage: 50 },
      ]);

      expect(prisma.usageLog.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: expect.any(Object),
        },
        orderBy: {
          timestamp: 'asc',
        },
      });
    });
  });
});
