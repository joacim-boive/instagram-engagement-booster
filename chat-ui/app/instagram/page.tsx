'use client';

import { InstagramPanel } from '@/components/instagram/instagram-panel';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

export default function InstagramPage() {
  return (
    <>
      <SignedIn>
        <div className="flex h-full">
          <div className="flex-1 h-full p-8">
            <div className="flex flex-col h-full">
              <h1 className="mb-4 text-2xl font-bold">Instagram Feed</h1>
              <div className="flex-1 overflow-auto">
                <InstagramPanel />
              </div>
            </div>
          </div>
          <div className="w-[400px] h-full border-l p-8">
            <div className="flex flex-col h-full">
              <h2 className="mb-4 text-xl font-semibold">Comments</h2>
              <div className="flex-1 overflow-auto">
                {/* Comments will be displayed here */}
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
