import { UserSettings } from './ai/types';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export class SettingsService {
  private settingsPath: string;
  private settings: Map<string, UserSettings> = new Map();

  constructor() {
    this.settingsPath = join(process.cwd(), 'user-settings.json');
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const data = readFileSync(this.settingsPath, 'utf-8');
      const settingsArray = JSON.parse(data) as UserSettings[];
      this.settings = new Map(settingsArray.map(s => [s.id, s]));
    } catch (error) {
      console.warn('No existing settings found, starting fresh');
      console.error(error);
    }
  }

  private saveSettings() {
    const settingsArray = Array.from(this.settings.values());
    writeFileSync(this.settingsPath, JSON.stringify(settingsArray, null, 2));
  }

  createSettings(name: string): UserSettings {
    const defaultSettings: UserSettings = {
      id: uuidv4(),
      name,
      systemPrompt: readFileSync(
        join(process.cwd(), 'prompts/system-prompt.txt'),
        'utf-8'
      ),
      aiProvider: 'openai',
      vectorConfig: {
        batchSize: 100,
        embeddingModel: 'text-embedding-3-small',
        relevantExamplesCount: 2,
        relevantExamplesMinScore: 0.7,
      },
      aiConfig: {
        temperature: 0.7,
        maxTokens: 150,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.settings.set(defaultSettings.id, defaultSettings);
    this.saveSettings();
    return defaultSettings;
  }

  getSettings(id: string): UserSettings | undefined {
    return this.settings.get(id);
  }

  updateSettings(id: string, updates: Partial<UserSettings>): UserSettings {
    const current = this.settings.get(id);
    if (!current) {
      throw new Error('Settings not found');
    }

    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date(),
    };

    this.settings.set(id, updated);
    this.saveSettings();
    return updated;
  }

  deleteSettings(id: string): boolean {
    const deleted = this.settings.delete(id);
    if (deleted) {
      this.saveSettings();
    }
    return deleted;
  }

  listSettings(): UserSettings[] {
    return Array.from(this.settings.values());
  }
}
