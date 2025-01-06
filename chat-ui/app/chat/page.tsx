'use client';

import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SettingsForm from '@/components/settings-form';
import { useSettings } from '@/contexts/SettingsContext';
import { SettingsWarning } from '@/components/settings-warning';
import { Spinner } from '@/components/ui/spinner';
import { TypingIndicator } from '@/components/ui/typing-indicator';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function ChatPage() {
  const { isValid, isLoading } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

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
      <div className="h-screen flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Spinner className="h-6 w-6" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-2xl mx-auto p-4">
      {!isValid && (
        <SettingsWarning onOpenSettings={() => setShowSettings(true)} />
      )}

      <div className="flex justify-between items-center mb-4 flex-none">
        <h1 className="text-2xl font-bold">Instagram Engagement Assistant</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
          className="hover:bg-muted"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <SettingsForm onClose={() => setShowSettings(false)} />
        </DialogContent>
      </Dialog>

      <Card className="flex-1 min-h-0 mb-4">
        <ScrollArea className="h-full p-4">
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
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}
              >
                {message.content || (
                  <TypingIndicator dotSize={6} startDelay={500} />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-muted-foreground text-center">Thinking...</div>
          )}
        </ScrollArea>
      </Card>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={!isValid}
          className="flex-grow"
        />
        <Button type="submit" disabled={!isValid || isLoading}>
          Send
        </Button>
      </form>
    </div>
  );
}
