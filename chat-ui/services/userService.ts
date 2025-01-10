import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export class UserService {
  static async ensureUser() {
    const user = await currentUser();
    if (!user) throw new Error('User not authenticated');

    const email = user.emailAddresses[0]?.emailAddress || null;

    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: email || '',
        monthlyTokens: 100, // Free tier default
      },
      update: {}, // No updates needed, just ensure it exists
    });

    return dbUser;
  }

  static async getCurrentUser() {
    const user = await currentUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        currentPeriodEnd: true,
        subscriptionId: true,
        subscriptionTier: true,
        monthlyTokens: true,
        instagramPageId: true,
        instagramAccessToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return dbUser;
  }
}
