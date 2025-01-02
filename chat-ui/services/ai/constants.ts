// Vector service configuration
export const VECTOR_CONFIG = {
  // Batch processing
  BATCH_SIZE: 100,

  // Embedding model
  EMBEDDING_MODEL: 'text-embedding-3-small',
  STRIP_NEWLINES: true,

  // Relevant examples
  RELEVANT_EXAMPLES_COUNT: 2,
  RELEVANT_EXAMPLES_MIN_SCORE: 0.7,

  // Content preview
  PREVIEW_LENGTH: 200,
} as const;

// AI provider configuration
export const AI_CONFIG = {
  // OpenAI
  OPENAI: {
    TEMPERATURE: 0.7,
    MAX_TOKENS: 150,
  },
  // Anthropic
  ANTHROPIC: {
    TEMPERATURE: 0.7,
    MAX_TOKENS: 150,
  },
} as const;
