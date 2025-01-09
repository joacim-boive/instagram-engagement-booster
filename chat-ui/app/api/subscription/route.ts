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

    // TODO: Handle payment processing here
    // For now, we'll just update the user's tier

    // Update user's subscription
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        monthlyTokens: TIER_LIMITS[tier as keyof typeof TIER_LIMITS],
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    return NextResponse.json({
      subscriptionTier: user.subscriptionTier,
      monthlyTokens: user.monthlyTokens,
      currentPeriodEnd: user.currentPeriodEnd,
    });
  } catch (error) {
    console.error('Error in subscription API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
