import { vi } from 'vitest';
import { mockClerkUser } from '../mocks/clerk';

export const withAuthentication = async (callback: () => Promise<void>) => {
  vi.mock('@clerk/nextjs', () => ({
    auth: vi.fn(() => Promise.resolve({ userId: mockClerkUser.id })),
  }));

  await callback();
};
