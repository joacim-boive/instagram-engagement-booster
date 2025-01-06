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
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 bg-gradient-to-b from-background to-muted">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
          Instagram Engagement Assistant
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mb-8">
          Boost your Instagram presence with AI-powered engagement strategies
          and content optimization
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/chat">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </SignedIn>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Supercharge Your Instagram Strategy
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Sparkles className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Get intelligent recommendations for content optimization and
                  posting strategies
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-12 w-12 mb-4 text-primary" />
                <CardTitle>Engagement Analysis</CardTitle>
                <CardDescription>
                  Understand your audience better with detailed engagement
                  metrics and trends
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Target className="h-12 w-12 mb-4 text-primary" />
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
      <footer className="border-t py-6 px-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          © 2024 Instagram Engagement Assistant. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
