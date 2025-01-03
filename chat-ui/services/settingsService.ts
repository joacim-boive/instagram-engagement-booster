import fs from 'fs/promises';
import path from 'path';
import { auth } from '@clerk/nextjs/server';

export type UserSettings = {
  id: string;
  userId: string;
  name: string;
  systemPrompt?: string;
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

export async function getUserSettings(): Promise<UserSettings[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  await ensureSettingsDir();
  const filePath = getUserSettingsPath(userId);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const settings = JSON.parse(fileContent);
    return Array.isArray(settings) ? settings : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function createUserSettings(name: string): Promise<UserSettings> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  await ensureSettingsDir();
  const filePath = getUserSettingsPath(userId);

  const newSettings: UserSettings = {
    id: crypto.randomUUID(),
    userId,
    name,
    aiProvider: 'openai',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    let settings: UserSettings[] = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      settings = JSON.parse(fileContent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    settings.push(newSettings);
    await fs.writeFile(filePath, JSON.stringify(settings, null, 2));
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
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const settings: UserSettings[] = JSON.parse(fileContent);

    const settingIndex = settings.findIndex(s => s.id === id);
    if (settingIndex === -1) throw new Error('Settings not found');

    // Validate that these settings belong to the current user
    if (settings[settingIndex].userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Update the settings
    settings[settingIndex] = {
      ...settings[settingIndex],
      ...updates,
      updatedAt: new Date(),
    };

    await fs.writeFile(filePath, JSON.stringify(settings, null, 2));
    return settings[settingIndex];
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
    const fileContent = await fs.readFile(filePath, 'utf-8');
    let settings: UserSettings[] = JSON.parse(fileContent);

    const settingIndex = settings.findIndex(s => s.id === id);
    if (settingIndex === -1) throw new Error('Settings not found');

    // Validate that these settings belong to the current user
    if (settings[settingIndex].userId !== userId) {
      throw new Error('Unauthorized');
    }

    settings = settings.filter(s => s.id !== id);
    await fs.writeFile(filePath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Failed to delete settings:', error);
    throw error;
  }
}
