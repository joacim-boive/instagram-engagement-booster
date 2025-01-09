'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { SettingsWarning } from '@/components/settings-warning';
import { Spinner } from '@/components/ui/spinner';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import SettingsForm from '@/components/settings-form';
import { TokenWarnings } from '@/components/token-warnings';
import { TokenLimitModal } from '@/components/token-limit-modal';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const tiers = [
  {
    name: 'Free',
    monthlyTokens: 100,
  },
  {
    name: 'Pro',
    monthlyTokens: 1000,
  },
  {
    name: 'Enterprise',
    monthlyTokens: 10000,
  },
];

type Tier = (typeof tiers)[number];

export default function ChatPage() {
  const { isValid, isLoading } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [tokenStatus, setTokenStatus] = useState<{
    canUseTokens: boolean;
    currentUsage: number;
    limit: number;
    remainingTokens: number;
    isNearLimit: boolean;
    usagePercentage: number;
  } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkTokens = async () => {
      try {
        const response = await fetch('/api/account');
        const data = await response.json();
        const tier =
          tiers.find(
            (t: Tier) => t.name.toUpperCase() === data.subscriptionTier
          ) || tiers[0];

        setTokenStatus({
          ...data.tokenStatus,
          limit: tier.monthlyTokens,
          usagePercentage:
            (data.tokenStatus.currentUsage / tier.monthlyTokens) * 100,
          canUseTokens: data.tokenStatus.currentUsage < tier.monthlyTokens,
          isNearLimit:
            data.tokenStatus.currentUsage / tier.monthlyTokens >= 0.8,
        });
      } catch (error) {
        console.error('Error checking token status:', error);
      }
    };

    checkTokens();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !tokenStatus?.canUseTokens) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Create a placeholder for the assistant's message
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      await axios.post(
        '/api/chat',
        { message: input },
        {
          responseType: 'stream',
          headers: {
            'Content-Type': 'application/json',
          },
          onDownloadProgress: progressEvent => {
            const chunk = progressEvent.event.target as { response: string };
            const lines = chunk.response.split('\n');
            let fullContent = '';

            for (const line of lines) {
              if (line.trim() === '') continue;
              try {
                const data = JSON.parse(line);
                fullContent += data.token;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.content = fullContent;
                  return newMessages;
                });
              } catch (e) {
                console.warn('Failed to parse line:', line, e);
              }
            }
          },
        }
      );
    } catch (error) {
      console.error('Failed to get response:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        });
      }
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.content = 'Error: Failed to generate response';
        return newMessages;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-2 text-muted-foreground">
        <Spinner className="w-6 h-6" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {tokenStatus && (
        <>
          {tokenStatus.isNearLimit && tokenStatus.canUseTokens && (
            <TokenWarnings tokenStatus={tokenStatus} className="m-4" />
          )}
          <TokenLimitModal
            isOpen={!tokenStatus.canUseTokens}
            currentUsage={tokenStatus.currentUsage}
            limit={tokenStatus.limit}
          />
        </>
      )}

      <div
        className={cn(
          'flex-1',
          !tokenStatus?.canUseTokens && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="grid grid-cols-[300px_1fr_400px] h-screen">
          {/* Left Column - Placeholder for Instagram Threads */}
          <div className="p-4 border-r">
            <h2 className="mb-4 text-lg font-semibold">Instagram Threads</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>

          {/* Middle Column - Chat Interface */}
          <div className="flex flex-col h-[calc(100vh-6rem)]">
            {!isValid && (
              <div className="p-4">
                <SettingsWarning onOpenSettings={() => {}} />
              </div>
            )}

            <div className="p-4">
              <h2 className="mb-4 text-lg font-semibold">
                Engagement Playground
              </h2>
            </div>

            <div className="flex-1 min-h-0 p-4 overflow-hidden">
              <Card className="flex flex-col h-full">
                <ScrollArea className="flex-1 p-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors'
                            : 'bg-emerald-100 text-emerald-900 shadow-sm dark:bg-emerald-900/20 dark:text-emerald-100'
                        }`}
                      >
                        {message.content || (
                          <TypingIndicator dotSize={6} startDelay={500} />
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </Card>
            </div>

            <div className="p-4 bg-background">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    tokenStatus?.canUseTokens
                      ? 'Type your message...'
                      : 'Token limit exceeded. Please upgrade your plan.'
                  }
                  disabled={!isValid || !tokenStatus?.canUseTokens}
                  className="flex-grow"
                />
                <Button
                  type="submit"
                  disabled={!isValid || isLoading || !tokenStatus?.canUseTokens}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="p-4 overflow-y-auto border-l">
            <h2 className="mb-4 text-lg font-semibold">Settings</h2>
            <SettingsForm onClose={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}
