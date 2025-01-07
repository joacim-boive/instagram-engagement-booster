'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { ArrowRight, MessageSquare, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center bg-gradient-to-b from-background to-muted">
        <h1 className="mb-4 text-4xl font-bold tracking-tighter md:text-6xl">
          Instagram Engagement Assistant
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mb-8">
          Boost your Instagram presence with AI-powered engagement strategies
          and content optimization
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/chat">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </SignedIn>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="mb-12 text-3xl font-bold text-center">
            Supercharge Your Instagram Strategy
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Sparkles className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Get intelligent recommendations for content optimization and
                  posting strategies
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Engagement Analysis</CardTitle>
                <CardDescription>
                  Understand your audience better with detailed engagement
                  metrics and trends
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Target className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Strategic Planning</CardTitle>
                <CardDescription>
                  Plan and schedule your content for maximum impact and reach
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t">
        <div className="max-w-6xl mx-auto text-sm text-center text-muted-foreground">
          © 2024 Instagram Engagement Assistant. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
