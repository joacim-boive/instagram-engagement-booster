'use client';

import { ChatPanel } from './components/chat-panel';
import { useAuth } from '@clerk/nextjs';
import { Spinner } from '@/components/ui/spinner';

export default function ChatPage() {
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
        <ChatPanel />
      </div>
    </div>
  );
}
