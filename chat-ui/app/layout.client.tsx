'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, BarChart3, UserCircle2 } from 'lucide-react';
import { ClerkProvider, SignedIn, UserButton } from '@clerk/nextjs';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { Toaster } from '@/components/ui/toaster';
import { Logo } from '@/components/ui/logo';

const inter = Inter({ subsets: ['latin'] });

const navigation = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Statistics', href: '/stats', icon: BarChart3 },
  { name: 'Account', href: '/account', icon: UserCircle2 },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ClerkProvider signInForceRedirectUrl="/chat">
      <SettingsProvider>
        <div className={cn(inter.className, 'flex h-screen bg-background')}>
          <div className="fixed top-0 bottom-0 left-0 hidden border-r md:flex md:w-16 md:flex-col">
            <div className="flex flex-col items-center w-full gap-4 py-6">
              <Link
                href="/"
                className={cn(
                  'group flex items-center justify-center p-2 rounded-md relative',
                  pathname === '/'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-primary/5'
                )}
              >
                <Logo />
                <span className="sr-only">Home</span>
                <div className="absolute invisible px-2 py-1 ml-2 text-sm rounded left-full group-hover:visible bg-popover text-popover-foreground whitespace-nowrap">
                  Home
                </div>
              </Link>
              {navigation.map(item => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-center p-2 rounded-md relative',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-primary/5'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="sr-only">{item.name}</span>
                    <div className="absolute invisible px-2 py-1 ml-2 text-sm rounded left-full group-hover:visible bg-popover text-popover-foreground whitespace-nowrap">
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col flex-1 md:pl-16">
            <header className="fixed top-0 right-0 p-4">
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10',
                      userButtonAvatarBox: 'w-10 h-10',
                    },
                  }}
                  afterSignOutUrl="/"
                />
              </SignedIn>
            </header>
            <main className="flex-1 pt-16">{children}</main>
            <Toaster />
          </div>
        </div>
      </SettingsProvider>
    </ClerkProvider>
  );
}
