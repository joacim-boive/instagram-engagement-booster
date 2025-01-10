import { z } from 'zod';

export const settingsSchema = z.object({
  // Instagram settings
  instagramHandle: z.string().optional(),
  instagramPageId: z.string().optional(),
  instagramAccessToken: z.string().optional(),

  // Facebook settings
  facebookPageId: z
    .string()
    .regex(
      /^\d{15}$/,
      'Facebook Page ID is required and must be exactly 15 digits'
    ),
  userPrompt: z.string().min(1, 'Personal Details are required'),
  aiProvider: z.enum(['openai', 'anthropic']).default('openai'),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  anthropicModel: z.string().optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
