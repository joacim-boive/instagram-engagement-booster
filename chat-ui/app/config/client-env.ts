'use client';

export const clientEnv = {
  openaiModel: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini',
  anthropicModel:
    process.env.NEXT_PUBLIC_ANTHROPIC_MODEL || 'claude-3-opus-20240229',
} as const;
