import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from './userService';
import { mockClerkUser } from '../tests/mocks/clerk';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import type { User } from '@clerk/nextjs/server';

// Mock Clerk's server auth
vi.mock('@clerk/nextjs/server', () => ({
  currentUser: vi.fn(() => Promise.resolve(mockClerkUser)),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('UserService', () => {
  const mockDbUser = {
    id: mockClerkUser.id,
    email: mockClerkUser.emailAddresses[0].emailAddress,
    monthlyTokens: 100,
    currentPeriodEnd: null,
    subscriptionId: null,
    subscriptionTier: 'free',
    instagramHandle: null,
    instagramAccessToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureUser', () => {
    it('should create user if not exists', async () => {
      vi.mocked(prisma.user.upsert).mockResolvedValue(mockDbUser);

      const user = await UserService.ensureUser();
      expect(user).toEqual(mockDbUser);
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { id: mockClerkUser.id },
        create: {
          id: mockClerkUser.id,
          email: mockClerkUser.emailAddresses[0].emailAddress,
          monthlyTokens: 100,
        },
        update: {},
      });
    });

    it('should handle user without email', async () => {
      const userWithoutEmail = {
        ...mockClerkUser,
        emailAddresses: [],
      } as unknown as User;
      vi.mocked(prisma.user.upsert).mockResolvedValue({
        ...mockDbUser,
        email: '',
      });
      vi.mocked(currentUser).mockResolvedValueOnce(userWithoutEmail);

      const user = await UserService.ensureUser();
      expect(user.email).toBe('');
    });

    it('should throw error when user not authenticated', async () => {
      vi.mocked(currentUser).mockResolvedValueOnce(null);

      await expect(UserService.ensureUser()).rejects.toThrow(
        'User not authenticated'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockDbUser);

      const user = await UserService.getCurrentUser();
      expect(user).toEqual(mockDbUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockClerkUser.id },
        select: {
          id: true,
          email: true,
          currentPeriodEnd: true,
          subscriptionId: true,
          subscriptionTier: true,
          monthlyTokens: true,
          instagramHandle: true,
          instagramAccessToken: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return null when user not authenticated', async () => {
      vi.mocked(currentUser).mockResolvedValueOnce(null);

      const user = await UserService.getCurrentUser();
      expect(user).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return null when user not found in database', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const user = await UserService.getCurrentUser();
      expect(user).toBeNull();
    });
  });
});
