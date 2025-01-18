import { serverEnv } from '@/config/server-env';
import type { UserSettings } from '@/types/settings';

export function getCurrentModel(settings: UserSettings): string {
  return settings.aiProvider === 'openai'
    ? settings.openaiModel || serverEnv.openaiModel
    : settings.anthropicModel || serverEnv.anthropicModel || 'unknown';
}

//TODO: Throw an error if an unsupported model is used
