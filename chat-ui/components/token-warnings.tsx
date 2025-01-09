import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type TokenStatus = {
  canUseTokens: boolean;
  currentUsage: number;
  limit: number;
  remainingTokens: number;
  isNearLimit: boolean;
  usagePercentage: number;
};

interface TokenWarningsProps {
  tokenStatus: TokenStatus | null;
  className?: string;
}

export function TokenWarnings({
  tokenStatus,
  className = '',
}: TokenWarningsProps) {
  if (!tokenStatus) return null;

  return (
    <>
      {!tokenStatus.canUseTokens && (
        <Alert variant="destructive" className={className}>
          <AlertOctagon className="w-4 h-4" />
          <AlertTitle>Token Limit Exceeded</AlertTitle>
          <AlertDescription>
            You&apos;ve used {tokenStatus.currentUsage.toLocaleString()} tokens
            out of your {tokenStatus.limit.toLocaleString()} token limit. Please
            upgrade your plan to continue using the service.
            <div className="mt-2">
              <Button variant="outline" asChild>
                <Link href="/account">Upgrade Plan</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {tokenStatus.isNearLimit && tokenStatus.canUseTokens && (
        <Alert className={`text-yellow-500 border-yellow-500 ${className}`}>
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Running Low on Tokens</AlertTitle>
          <AlertDescription>
            You have used {tokenStatus.usagePercentage.toFixed(1)}% of your
            monthly token allowance. Consider upgrading your plan to ensure
            uninterrupted service.
            <div className="mt-2">
              <Button variant="outline" asChild>
                <Link href="/account">View Plans</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
