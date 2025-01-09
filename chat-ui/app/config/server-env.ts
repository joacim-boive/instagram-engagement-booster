const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required in environment variables`);
  }
  return value;
};

export const serverEnv = {
  openaiApiKey: getEnvVar('OPENAI_API_KEY'),
  openaiModel: getEnvVar('OPENAI_MODEL'),
  anthropicApiKey: getEnvVar('ANTHROPIC_API_KEY'),
  anthropicModel: getEnvVar('ANTHROPIC_MODEL'),
  trainingDataPath: getEnvVar('TRAINING_DATA_PATH'),
  systemPromptPath: getEnvVar('SYSTEM_PROMPT_PATH'),
} as const;
