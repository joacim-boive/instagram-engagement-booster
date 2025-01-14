import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService, type SocialConfig } from './configService';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('ConfigService', () => {
  const mockConfig: SocialConfig = {
    instagramHandle: 'test.handle',
    accessToken: 'test-access-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstagramConfig', () => {
    it('should return config when available', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          instagramHandle: mockConfig.instagramHandle,
          instagramAccessToken: mockConfig.accessToken,
        },
      });

      const config = await ConfigService.getInstagramConfig();
      expect(config).toEqual(mockConfig);
      expect(axios.get).toHaveBeenCalledWith('/api/instagram/config');
    });

    it('should return null when config is incomplete', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          instagramHandle: mockConfig.instagramHandle,
        },
      });

      const config = await ConfigService.getInstagramConfig();
      expect(config).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('API Error'));

      const config = await ConfigService.getInstagramConfig();
      expect(config).toBeNull();
    });
  });

  describe('setInstagramConfig', () => {
    it('should post config successfully', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: {} });

      await ConfigService.setInstagramConfig(mockConfig);
      expect(axios.post).toHaveBeenCalledWith(
        '/api/instagram/config',
        mockConfig
      );
    });

    it('should throw error on failure', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('API Error'));

      await expect(
        ConfigService.setInstagramConfig(mockConfig)
      ).rejects.toThrow('API Error');
    });
  });
});
