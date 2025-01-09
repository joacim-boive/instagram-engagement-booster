'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Loader2 } from 'lucide-react';
import { TokenWarnings } from '@/components/token-warnings';
import { TokenStatus } from '@/lib/types/token-status';
import { useToast } from '@/hooks/use-toast';

const tiers = [
  {
    name: 'Free',
    price: 0,
    monthlyTokens: 100,
    features: [
      'Up to 100 tokens per month',
      'Basic response generation',
      'Standard support',
      'Single model access',
    ],
  },
  {
    name: 'Pro',
    price: 29,
    monthlyTokens: 1000,
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
    price: 99,
    monthlyTokens: 10000,
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
  const { user } = useUser();
  const { toast } = useToast();
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({
    canUseTokens: true,
    currentUsage: 0,
    limit: 100,
    remainingTokens: 100,
    isNearLimit: false,
    usagePercentage: 0,
  });
  const [currentTier, setCurrentTier] = useState('FREE');
  const [loading, setLoading] = useState(true);
  const [updatingTier, setUpdatingTier] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/account');
        const data = await response.json();
        const tier =
          tiers.find(t => t.name.toUpperCase() === data.subscriptionTier) ||
          tiers[0];

        setTokenStatus({
          ...data.tokenStatus,
          limit: tier.monthlyTokens,
          usagePercentage:
            (data.tokenStatus.currentUsage / tier.monthlyTokens) * 100,
          canUseTokens: data.tokenStatus.currentUsage < tier.monthlyTokens,
          isNearLimit:
            data.tokenStatus.currentUsage / tier.monthlyTokens >= 0.8,
        });
        setCurrentTier(data.subscriptionTier);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load account data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, toast]);

  const handleSubscriptionChange = async (newTier: string) => {
    setUpdatingTier(newTier);
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: newTier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }

      const data = await response.json();
      setCurrentTier(data.subscriptionTier);
      toast({
        variant: 'success',
        title: 'Success',
        description: `Your subscription has been updated to ${newTier.toLowerCase()}.`,
      });

      // Refresh token status
      const accountResponse = await fetch('/api/account');
      const accountData = await accountResponse.json();
      const tier =
        tiers.find(
          t => t.name.toUpperCase() === accountData.subscriptionTier
        ) || tiers[0];

      setTokenStatus({
        ...accountData.tokenStatus,
        limit: tier.monthlyTokens,
        usagePercentage:
          (accountData.tokenStatus.currentUsage / tier.monthlyTokens) * 100,
        canUseTokens: accountData.tokenStatus.currentUsage < tier.monthlyTokens,
        isNearLimit:
          accountData.tokenStatus.currentUsage / tier.monthlyTokens >= 0.8,
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
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

  if (loading) {
    return <div className="p-8">Loading account details...</div>;
  }

  if (!user) {
    return <div className="p-8">Please sign in to view your account.</div>;
  }

  return (
    <div className="container p-8 mx-auto">
      <h1 className="mb-8 text-3xl font-bold">Account Settings</h1>

      <TokenWarnings tokenStatus={tokenStatus} className="mb-4" />

      {/* Current Usage */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>Your token usage this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {tokenStatus.currentUsage.toLocaleString()} tokens used
              </span>
              <span>{tokenStatus.limit.toLocaleString()} tokens limit</span>
            </div>
            <Progress value={tokenStatus.usagePercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Subscription Tiers */}
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map(tier => (
          <Card
            key={tier.name}
            className={
              tier.name.toUpperCase() === currentTier ? 'border-primary' : ''
            }
          >
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>${tier.price}/month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tier.features.map(feature => (
                  <li key={feature} className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={
                  tier.name.toUpperCase() === currentTier
                    ? 'outline'
                    : 'default'
                }
                disabled={
                  tier.name.toUpperCase() === currentTier ||
                  updatingTier === tier.name.toUpperCase()
                }
                onClick={() =>
                  handleSubscriptionChange(tier.name.toUpperCase())
                }
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
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
