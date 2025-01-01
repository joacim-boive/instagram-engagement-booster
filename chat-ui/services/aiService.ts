import { OpenAiProvider } from '@/services/openaiProvider';
import { AnthropicProvider } from '@/services/anthropicProvider';
import { AiProvider, Message, ProviderConfig } from '@/services/ai/types';
import { env } from '../app/config/env';
import { readFileSync } from 'fs';
import { join } from 'path';

type TrainingMessage = {
  content: string;
  author: string;
  authorId: string;
  timestamp?: string;
};

type Conversation = {
  messages: TrainingMessage[];
  postId: string;
  commentId: string;
};

export class AiService {
  private systemPrompt: string;
  private trainingData: Conversation[];
  private provider: AiProvider;
  private pageId: string;

  constructor(config?: ProviderConfig) {
    this.systemPrompt = this.loadSystemPrompt();
    this.trainingData = this.loadTrainingData();
    this.pageId = env.facebookPageId;

    if (config?.openai?.apiKey) {
      this.provider = new OpenAiProvider(
        config.openai.apiKey,
        config.openai.model
      );
    } else if (config?.anthropic?.apiKey) {
      this.provider = new AnthropicProvider(
        config.anthropic.apiKey,
        config.anthropic.model
      );
    } else {
      throw new Error('No valid AI provider configuration found');
    }
  }

  private loadFile<T>(path: string, parser?: (data: string) => T): T | string {
    try {
      const filePath = join(process.cwd(), path);
      const fileContent = readFileSync(filePath, 'utf-8');
      console.log(`Loaded file from: ${filePath}`);

      return parser ? parser(fileContent) : fileContent;
    } catch (error) {
      console.error(`Error loading file ${path}:`, error);
      throw error;
    }
  }

  private loadSystemPrompt(): string {
    try {
      const path = env.systemPromptPath || 'chat-ui/prompts/system-prompt.txt';
      const data = this.loadFile(path) as string;
      console.log(`Loaded size of system prompt: ${data.length}`);
      return data;
    } catch (error) {
      console.warn('Falling back to default system prompt');
      console.error('Error loading system prompt:', error);
      return 'Default system prompt';
    }
  }

  private loadTrainingData(): Conversation[] {
    try {
      const path = env.trainingDataPath || 'training-data.json';
      const data = this.loadFile(path, JSON.parse) as Conversation[];
      console.log(`Loaded ${data.length} conversations`);
      return data;
    } catch (error) {
      console.warn('Falling back to empty training data');
      console.error('Error loading training data:', error);
      return [];
    }
  }

  async generateResponse(userMessage: string): Promise<string> {
    const messages: Message[] = [
      { role: 'system', content: this.systemPrompt },
      ...this.getRelevantExamples(userMessage),
      { role: 'user', content: userMessage },
    ];

    return this.provider.generateResponse(messages);
  }

  async generateStreamingResponse(
    userMessage: string,
    onToken: (token: string) => void
  ): Promise<void> {
    const messages: Message[] = [
      { role: 'system', content: this.systemPrompt },
      ...this.getRelevantExamples(userMessage),
      { role: 'user', content: userMessage },
    ];

    return this.provider.generateStreamingResponse(messages, onToken);
  }

  private getRelevantExamples(_userMessage: string): Message[] {
    const examples: Message[] = [];
    const sampleConversations = this.trainingData.slice(0, 3);

    for (const conv of sampleConversations) {
      for (const msg of conv.messages) {
        examples.push({
          role: msg.authorId === this.pageId ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    return examples;
  }
}
