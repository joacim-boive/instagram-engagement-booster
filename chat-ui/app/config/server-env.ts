import { z } from 'zod';

const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required in environment variables`);
  }
  return value;
};

const serverEnvSchema = z.object({
  openaiApiKey: z.string(),
  openaiModel: z.string(),
  anthropicApiKey: z.string(),
  anthropicModel: z.string(),
  freeTierTokens: z.coerce.number().default(100),
  trainingDataPath: z.string(),
  systemPromptPath: z.string(),
});

export const serverEnv = serverEnvSchema.parse({
  openaiApiKey: getEnvVar('OPENAI_API_KEY'),
  openaiModel: getEnvVar('OPENAI_MODEL'),
  anthropicApiKey: getEnvVar('ANTHROPIC_API_KEY'),
  anthropicModel: getEnvVar('ANTHROPIC_MODEL'),
  trainingDataPath: getEnvVar('TRAINING_DATA_PATH'),
  systemPromptPath: getEnvVar('SYSTEM_PROMPT_PATH'),
  freeTierTokens: getEnvVar('FREE_TIER_TOKENS'),
});
