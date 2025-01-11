export type UserSettings = {
  id: string;
  userId: string;
  name: string;
  instagramPageId?: string;
  instagramAccessToken?: string;
  facebookPageId?: string;
  userPrompt: string;
  aiProvider: 'openai' | 'anthropic';
  openaiApiKey?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  createdAt: Date;
  updatedAt: Date;
};
