'use client';

export const clientEnv = {
  openaiModel: process.env.NEXT_PUBLIC_OPENAI_MODEL,
  anthropicModel: process.env.NEXT_PUBLIC_ANTHROPIC_MODEL,
} as const;
