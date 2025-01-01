const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required in environment variables`);
  }
  return value;
};

export const env = {
  facebookPageId: getEnvVar('FACEBOOK_PAGE_ID'),
  openaiApiKey: getEnvVar('OPENAI_API_KEY'),
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
  trainingDataPath: process.env.TRAINING_DATA_PATH || 'training-data.json',
  systemPromptPath:
    process.env.SYSTEM_PROMPT_PATH || 'prompts/system-prompt.txt',
  vectorStorePath: process.env.VECTOR_STORE_PATH || './vector-store.json',
} as const;
