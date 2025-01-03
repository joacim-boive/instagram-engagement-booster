import { ClerkProvider, SignedIn, UserButton } from '@clerk/nextjs';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Instagram Engagement Assistant',
  description: 'AI-powered Instagram engagement tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider signInForceRedirectUrl={'/chat'}>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen pt-16">
            <header className="fixed top-0 right-0 p-4">
              <SignedIn>
                <UserButton />
              </SignedIn>
            </header>
            <main>{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
