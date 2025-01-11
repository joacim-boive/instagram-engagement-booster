import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertOctagon } from 'lucide-react';

type TokenLimitModalProps = {
  isOpen: boolean;
  currentUsage: number;
  limit: number;
};

export function TokenLimitModal({
  isOpen,
  currentUsage,
  limit,
}: TokenLimitModalProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-destructive" />
            Token Limit Exceeded
          </AlertDialogTitle>
          <div className="space-y-4">
            <AlertDialogDescription>
              You&apos;ve used {currentUsage?.toLocaleString() || '0'} tokens
              out of your {limit.toLocaleString()} token limit. Please upgrade
              your plan to continue using the service.
            </AlertDialogDescription>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/account">Upgrade Plan</Link>
              </Button>
            </div>
          </div>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
