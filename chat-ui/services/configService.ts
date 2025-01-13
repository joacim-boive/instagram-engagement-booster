import axios from 'axios';

export type SocialConfig = {
  instagramHandle: string;
  accessToken: string;
};

export class ConfigService {
  static async getInstagramConfig(): Promise<SocialConfig | null> {
    try {
      const response = await axios.get('/api/instagram/config');
      const { instagramHandle, instagramAccessToken } = response.data;
      if (!instagramHandle || !instagramAccessToken) {
        return null;
      }
      return {
        instagramHandle,
        accessToken: instagramAccessToken,
      };
    } catch (error) {
      console.error('Error fetching Instagram config:', error);
      return null;
    }
  }

  static async setInstagramConfig(config: SocialConfig): Promise<void> {
    try {
      await axios.post('/api/instagram/config', config);
    } catch (error) {
      console.error('Error setting Instagram config:', error);
      throw error;
    }
  }
}
