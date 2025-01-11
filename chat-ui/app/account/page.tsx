'use client';

import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { TokenUsageChart } from '@/components/token-usage-chart';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Tier = {
  name: string;
  monthlyTokens: number;
  price: number;
  features: string[];
};

const tiers: Tier[] = [
  {
    name: 'Free',
    monthlyTokens: 100,
    price: 0,
    features: [
      'Up to 100 tokens per month',
      'Basic response generation',
      'Standard support',
      'Single model access',
    ],
  },
  {
    name: 'Pro',
    monthlyTokens: 1000,
    price: 29,
    features: [
      'Up to 1,000 tokens per month',
      'Advanced response generation',
      'Priority support',
      'Access to all models',
      'Custom prompts',
      'Analytics dashboard',
    ],
  },
  {
    name: 'Enterprise',
    monthlyTokens: 10000,
    price: 99,
    features: [
      'Up to 10,000 tokens per month',
      'Advanced response generation',
      'Premium support',
      'Access to all models',
      'Custom prompts',
      'Advanced analytics',
      'Custom model fine-tuning',
      'Dedicated account manager',
    ],
  },
];

export default function AccountPage() {
  const { isLoaded: isAuthLoaded, userId } = useAuth();
  const { toast } = useToast();
  const [currentTier, setCurrentTier] = useState('FREE');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTier, setUpdatingTier] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<{
    currentUsage: number;
    limit: number;
    usagePercentage: number;
  } | null>(null);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        const response = await fetch('/api/account');
        const data = await response.json();
        setCurrentTier(data.subscriptionTier);
        const tier =
          tiers.find(t => t.name.toUpperCase() === data.subscriptionTier) ||
          tiers[0];
        setTokenStatus({
          currentUsage: data.tokenStatus.currentUsage,
          limit: tier.monthlyTokens,
          usagePercentage:
            (data.tokenStatus.currentUsage / tier.monthlyTokens) * 100,
        });
      } catch (error) {
        console.error('Error fetching account info:', error);
        toast({
          title: 'Error',
          description: 'Failed to load account data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if auth is loaded and we have a userId
    if (isAuthLoaded && userId) {
      fetchAccountInfo();
    }
  }, [toast, isAuthLoaded, userId]);

  const handleUpgrade = async (newTier: string) => {
    if (!isAuthLoaded || !userId) return;

    setUpdatingTier(newTier);
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: newTier }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }

      const data = await response.json();
      const isDowngrade =
        (tiers.find(t => t.name.toUpperCase() === newTier)?.monthlyTokens ||
          0) <
        (tiers.find(t => t.name.toUpperCase() === currentTier)?.monthlyTokens ||
          0);

      setCurrentTier(data.subscriptionTier);
      toast({
        variant: 'success',
        title: 'Success',
        description: `Your subscription has been ${
          isDowngrade ? 'downgraded' : 'upgraded'
        } to ${newTier.toLowerCase()}.`,
      });

      // Refresh token status
      const accountResponse = await fetch('/api/account');
      const accountData = await accountResponse.json();
      const tier =
        tiers.find(
          t => t.name.toUpperCase() === accountData.subscriptionTier
        ) || tiers[0];
      setTokenStatus({
        currentUsage: accountData.tokenStatus.currentUsage,
        limit: tier.monthlyTokens,
        usagePercentage:
          (accountData.tokenStatus.currentUsage / tier.monthlyTokens) * 100,
      });
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update subscription',
        variant: 'destructive',
      });
    } finally {
      setUpdatingTier(null);
    }
  };

  // Show loading state while auth is loading
  if (!isAuthLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <>
      <SignedIn>
        <div className="p-8">
          <h1 className="mb-8 text-3xl font-bold">Account Settings</h1>

          {/* Token Usage Section */}
          {tokenStatus && (
            <Card className="p-6 mb-8">
              <h2 className="mb-4 text-xl font-semibold">Token Usage</h2>
              <TokenUsageChart
                currentUsage={tokenStatus.currentUsage}
                limit={tokenStatus.limit}
                usagePercentage={tokenStatus.usagePercentage}
              />
            </Card>
          )}

          {/* Subscription Tiers */}
          <h2 className="mb-4 text-xl font-semibold">Subscription Plans</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map(tier => (
              <Card key={tier.name} className="p-6">
                <h3 className="mb-2 text-lg font-medium">{tier.name}</h3>
                <p className="mb-4 text-2xl font-bold">${tier.price}/month</p>
                <ul className="mb-6 space-y-2">
                  {tier.features.map(feature => (
                    <li key={feature} className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={
                    tier.name.toUpperCase() === currentTier
                      ? 'outline'
                      : tier.monthlyTokens <
                          (tiers.find(t => t.name.toUpperCase() === currentTier)
                            ?.monthlyTokens || 0)
                        ? 'destructive'
                        : 'success'
                  }
                  disabled={
                    tier.name.toUpperCase() === currentTier ||
                    updatingTier === tier.name.toUpperCase()
                  }
                  onClick={() => handleUpgrade(tier.name.toUpperCase())}
                >
                  {updatingTier === tier.name.toUpperCase() ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : tier.name.toUpperCase() === currentTier ? (
                    'Current Plan'
                  ) : (
                    <>
                      {tier.monthlyTokens <
                      (tiers.find(t => t.name.toUpperCase() === currentTier)
                        ?.monthlyTokens || 0)
                        ? 'Downgrade'
                        : 'Upgrade'}
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
