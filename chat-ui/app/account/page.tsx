'use client';

import { AccountPanel } from './components/account-panel';
import { useAuth } from '@clerk/nextjs';
import { Spinner } from '@/components/ui/spinner';

export default function AccountPage() {
  const { isLoaded: isAuthLoaded } = useAuth();

  if (!isAuthLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 h-full">
        <AccountPanel />
      </div>
    </div>
  );
}
