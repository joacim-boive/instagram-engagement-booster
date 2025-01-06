export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AiConfig = {
  provider: 'openai' | 'anthropic';
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

export type TrainingMessage = {
  content: string;
  author: string;
  authorId: string;
  timestamp?: string;
};

export type Conversation = {
  messages: TrainingMessage[];
  postId: string;
  commentId: string;
};

export interface AiProvider {
  generateResponse(messages: Message[]): Promise<string>;
  generateStreamingResponse(
    messages: Message[],
    onToken: (token: string) => void
  ): Promise<void>;
}

export type ProviderConfig = {
  openai?: {
    apiKey: string;
    model: string;
  };
  anthropic?: {
    apiKey: string;
    model: string;
  };
};

export type UserSettings = {
  id: string;
  name: string;
  systemPrompt: string;
  aiProvider: 'openai' | 'anthropic';
  openaiApiKey?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  vectorConfig: {
    batchSize: number;
    embeddingModel: string;
    relevantExamplesCount: number;
    relevantExamplesMinScore: number;
  };
  aiConfig: {
    temperature: number;
    maxTokens: number;
  };
  createdAt: Date;
  updatedAt: Date;
};
