import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUserSettings,
  createUserSettings,
  updateUserSettings,
  deleteUserSettings,
} from './settingsService';
import { mockClerkUser } from '../tests/mocks/clerk';
import fs from 'fs/promises';

// Mock the fs module
vi.mock('fs/promises');

// Mock Clerk's server auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: mockClerkUser.id })),
  currentUser: vi.fn(() => Promise.resolve(mockClerkUser)),
}));

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserSettings', () => {
    it('should return user settings when file exists', async () => {
      const mockSettings = {
        id: 'test-settings-id',
        userId: mockClerkUser.id,
        name: 'Test Settings',
        aiProvider: 'openai',
        userPrompt: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSettings));

      const settings = await getUserSettings();
      expect(settings).toEqual(mockSettings);
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining(mockClerkUser.id),
        'utf-8'
      );
    });

    it('should return null when settings file does not exist', async () => {
      const error = new Error('File not found');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const settings = await getUserSettings();
      expect(settings).toBeNull();
    });

    it('should return null when settings belong to different user', async () => {
      const mockSettings = {
        id: 'test-settings-id',
        userId: 'different-user-id',
        name: 'Test Settings',
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSettings));

      const settings = await getUserSettings();
      expect(settings).toBeNull();
    });
  });

  describe('createUserSettings', () => {
    it('should create new settings successfully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' }); // No existing settings
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.mkdir).mockResolvedValue('/path/to/settings');

      const result = await createUserSettings('Test Settings', {
        aiProvider: 'anthropic',
        userPrompt: 'Custom prompt',
      });

      expect(result).toEqual({
        id: expect.any(String),
        userId: mockClerkUser.id,
        name: 'Test Settings',
        aiProvider: 'anthropic',
        userPrompt: 'Custom prompt',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(mockClerkUser.id),
        expect.any(String)
      );
    });

    it('should throw error if settings already exist', async () => {
      const existingSettings = {
        id: 'existing-id',
        userId: mockClerkUser.id,
        name: 'Existing Settings',
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(existingSettings)
      );

      await expect(createUserSettings('New Settings')).rejects.toThrow(
        'Settings already exist for this user'
      );
    });
  });

  describe('updateUserSettings', () => {
    const testSettings = {
      instagramHandle: 'test.user',
      instagramAccessToken: 'test-token',
    };

    it('should update user settings successfully', async () => {
      const existingSettings = {
        id: 'test-id',
        userId: mockClerkUser.id,
        name: 'Test Settings',
        aiProvider: 'openai',
        userPrompt: '',
        createdAt: new Date().toString(),
        updatedAt: new Date().toString(),
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(existingSettings)
      );
      vi.mocked(fs.writeFile).mockResolvedValue();

      const result = await updateUserSettings('test-id', testSettings);

      expect(result).toEqual({
        ...existingSettings,
        ...testSettings,
        updatedAt: expect.any(Date),
      });
    });

    it('should throw error when settings not found', async () => {
      const error = new Error('File not found');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(updateUserSettings('test-id', testSettings)).rejects.toThrow(
        'Settings not found'
      );
    });

    it('should throw settings not found when settings belong to different user', async () => {
      const existingSettings = {
        id: 'test-id',
        userId: 'different-user-id',
        name: 'Test Settings',
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(existingSettings)
      );

      await expect(updateUserSettings('test-id', testSettings)).rejects.toThrow(
        'Settings not found'
      );
    });
  });

  describe('deleteUserSettings', () => {
    it('should delete settings successfully', async () => {
      const existingSettings = {
        id: 'test-id',
        userId: mockClerkUser.id,
        name: 'Test Settings',
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(existingSettings)
      );
      vi.mocked(fs.unlink).mockResolvedValue();

      await deleteUserSettings('test-id');
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining(mockClerkUser.id)
      );
    });

    it('should throw error when settings not found', async () => {
      const error = new Error('File not found');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(deleteUserSettings('test-id')).rejects.toThrow(
        'Settings not found'
      );
    });

    it('should throw settings not found when settings belong to different user', async () => {
      const existingSettings = {
        id: 'test-id',
        userId: 'different-user-id',
        name: 'Test Settings',
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(existingSettings)
      );

      await expect(deleteUserSettings('test-id')).rejects.toThrow(
        'Settings not found'
      );
    });
  });
});
