import axios from 'axios';
import express, { Request, Response } from 'express';
import open from 'open';
import { instagramConfig } from '../config/instagram.js';

export class AuthService {
  private app = express();
  private server!: ReturnType<typeof this.app.listen>;
  private readonly clientId = instagramConfig.clientId;
  private readonly clientSecret = instagramConfig.clientSecret;
  private readonly pageId = instagramConfig.pageId;
  private readonly redirectUri = 'http://localhost:3000/auth/callback';
  private readonly scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_read_engagement',
    'pages_manage_metadata',
    'pages_show_list',
    'pages_manage_engagement',
    'pages_manage_posts',
    'pages_manage_metadata'
  ];

  async getNewToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setupAuthServer(resolve, reject);
      this.startAuthFlow();
    });
  }

  private setupAuthServer(resolve: () => void, reject: (error: Error) => void): void {
    this.app.get('/auth/callback', async (req: Request, res: Response) => {
      const { code } = req.query;
      
      if (!code || typeof code !== 'string') {
        res.send('Authentication failed');
        reject(new Error('No code received'));
        return;
      }

      try {
        // Exchange code for access token
        const response = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
          params: {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            code: code
          }
        });

        const { access_token } = response.data;
        
        // Get long-lived token
        const longLivedToken = await this.getLongLivedToken(access_token);
        
        // Get page access token
        const pageToken = await this.getPageAccessToken(longLivedToken);
        
        res.send('Authentication successful! You can close this window.');
        console.log('New page access token:', pageToken);
        
        this.server.close();
        resolve();
      } catch (error) {
        console.error('Error exchanging code for token:', error);
        res.send('Authentication failed');
        reject(error instanceof Error ? error : new Error('Authentication failed'));
      }
    });

    this.server = this.app.listen(3000, () => {
      console.log('Auth server running on http://localhost:3000');
    });
  }

  private async getLongLivedToken(shortLivedToken: string): Promise<string> {
    const response = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        fb_exchange_token: shortLivedToken
      }
    });

    return response.data.access_token;
  }

  private async getPageAccessToken(userAccessToken: string): Promise<string> {
    const response = await axios.get(`https://graph.facebook.com/v21.0/${this.pageId}`, {
      params: {
        fields: 'access_token',
        access_token: userAccessToken
      }
    });

    return response.data.access_token;
  }

  private startAuthFlow(): void {
    const authUrl = `https://facebook.com/v21.0/dialog/oauth?${new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(','),
      response_type: 'code'
    })}`;

    open(authUrl);
  }
} 