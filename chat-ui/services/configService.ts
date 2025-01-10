import axios from 'axios';

export type SocialConfig = {
  pageId: string;
  accessToken: string;
};

export class ConfigService {
  static async getInstagramConfig(): Promise<SocialConfig | null> {
    try {
      const response = await axios.get('/api/instagram/config');
      const user = response.data;
      if (!user?.instagramPageId || !user?.instagramAccessToken) {
        return null;
      }
      return {
        pageId: user.instagramPageId,
        accessToken: user.instagramAccessToken,
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
