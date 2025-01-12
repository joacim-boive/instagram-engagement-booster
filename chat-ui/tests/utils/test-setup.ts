import { vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

export const setupPrismaTest = () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  return {
    prisma: vi.mocked(prisma),
  };
};
