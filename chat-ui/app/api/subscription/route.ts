import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TIER_LIMITS = {
  FREE: 100,
  PRO: 1000,
  ENTERPRISE: 10000,
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { tier } = body;

    if (!tier || !TIER_LIMITS[tier as keyof typeof TIER_LIMITS]) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log('Current user state:', existingUser);

    // Update user's subscription
    try {
      const updateData = {
        subscriptionTier: tier,
        monthlyTokens: TIER_LIMITS[tier as keyof typeof TIER_LIMITS],
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        updatedAt: new Date(), // Ensure the updated timestamp is set
      };

      console.log('Attempting to update user with data:', updateData);

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      console.log('Updated user subscription:', {
        userId,
        tier,
        monthlyTokens: user.monthlyTokens,
        subscriptionTier: user.subscriptionTier,
        beforeUpdate: existingUser,
        afterUpdate: user,
      });

      return NextResponse.json({
        subscriptionTier: user.subscriptionTier,
        monthlyTokens: user.monthlyTokens,
        currentPeriodEnd: user.currentPeriodEnd,
      });
    } catch (error) {
      console.error('Database error updating subscription:', error);
      throw new Error(
        `Failed to update subscription in database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  } catch (error) {
    console.error('Error in subscription API:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
