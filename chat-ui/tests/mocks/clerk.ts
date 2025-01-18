import { vi } from 'vitest';

export const mockClerkUser = {
  id: 'test-user-id',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
};

vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: mockClerkUser.id })),
  currentUser: vi.fn(() => Promise.resolve(mockClerkUser)),
  clerkClient: {
    users: {
      getUser: vi.fn(() => Promise.resolve(mockClerkUser)),
    },
  },
}));
