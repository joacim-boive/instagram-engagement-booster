import fs from 'fs/promises';
import path from 'path';
import { auth } from '@clerk/nextjs/server';

export type UserSettings = {
  id: string;
  userId: string;
  name: string;
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

const SETTINGS_DIR = path.join(process.cwd(), 'data', 'settings');

// Ensure settings directory exists
async function ensureSettingsDir() {
  try {
    await fs.mkdir(SETTINGS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create settings directory:', error);
    throw error;
  }
}

// Get the file path for a user's settings
function getUserSettingsPath(userId: string) {
  return path.join(SETTINGS_DIR, `${userId}.json`);
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  await ensureSettingsDir();
  const filePath = getUserSettingsPath(userId);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const settings = JSON.parse(fileContent);
    // Handle both array and single object formats
    if (Array.isArray(settings)) {
      return settings[0] || null;
    }
    return settings;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function createUserSettings(
  name: string,
  additionalSettings: Partial<UserSettings> = {}
): Promise<UserSettings> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  await ensureSettingsDir();
  const filePath = getUserSettingsPath(userId);

  const newSettings: UserSettings = {
    id: crypto.randomUUID(),
    userId,
    name,
    aiProvider: additionalSettings.aiProvider || 'openai',
    userPrompt: additionalSettings.userPrompt || '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...additionalSettings,
  };

  try {
    // Check if settings already exist
    const existingSettings = await getUserSettings();
    if (existingSettings) {
      throw new Error('Settings already exist for this user');
    }

    // Write as a single object, not an array
    await fs.writeFile(filePath, JSON.stringify(newSettings, null, 2));
    return newSettings;
  } catch (error) {
    console.error('Failed to create settings:', error);
    throw error;
  }
}

export async function updateUserSettings(
  id: string,
  updates: Partial<UserSettings>
): Promise<UserSettings> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const filePath = getUserSettingsPath(userId);

  try {
    const existingSettings = await getUserSettings();
    if (!existingSettings) throw new Error('Settings not found');

    // Validate that these settings belong to the current user
    if (existingSettings.userId !== userId || existingSettings.id !== id) {
      throw new Error('Unauthorized');
    }

    // Update the settings
    const updatedSettings = {
      ...existingSettings,
      ...updates,
      updatedAt: new Date(),
    };

    // Write as a single object, not an array
    await fs.writeFile(filePath, JSON.stringify(updatedSettings, null, 2));
    return updatedSettings;
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
}

export async function deleteUserSettings(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const filePath = getUserSettingsPath(userId);

  try {
    const existingSettings = await getUserSettings();
    if (!existingSettings) throw new Error('Settings not found');

    // Validate that these settings belong to the current user
    if (existingSettings.userId !== userId || existingSettings.id !== id) {
      throw new Error('Unauthorized');
    }

    await fs.unlink(filePath);
  } catch (error) {
    console.error('Failed to delete settings:', error);
    throw error;
  }
}
