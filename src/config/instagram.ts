import dotenv from 'dotenv';
dotenv.config();

type InstagramConfig = {
  accessToken: string;
  userId: string;
  pageId: string;
  clientId: string;
  clientSecret: string;
};

export const instagramConfig: InstagramConfig = {
  accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
  userId: process.env.INSTAGRAM_USER_ID || '',
  pageId: process.env.FACEBOOK_PAGE_ID || '',
  clientId: process.env.FACEBOOK_CLIENT_ID || '',
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
};

// Validate config
if (!instagramConfig.accessToken) {
  throw new Error('FACEBOOK_ACCESS_TOKEN is required in .env file');
}

if (!instagramConfig.pageId) {
  throw new Error('FACEBOOK_PAGE_ID is required in .env file');
} 