import { vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

export const setupPrismaTest = () => {
  const token = process.env.TEST_USER_TOKEN;
  if (!token) {
    throw new Error(
      'Please provide TEST_USER_TOKEN in .env - see https://dev.to/mad/api-testing-with-clerk-and-express-2i56'
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // Set the authorization header globally for tests
    process.env.__CLERK_AUTH_TOKEN = token;
  });

  return {
    prisma: vi.mocked(prisma),
    testToken: token,
  };
};
