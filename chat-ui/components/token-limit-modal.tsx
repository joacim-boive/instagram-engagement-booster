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
          <AlertDialogDescription className="space-y-4">
            You&apos;ve used {currentUsage.toLocaleString()} tokens out of your{' '}
            {limit.toLocaleString()} token limit. Please upgrade your plan to
            continue using the service.
            <div className="flex justify-center pt-2">
              <Button asChild>
                <Link href="/account">Upgrade Plan</Link>
              </Button>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
