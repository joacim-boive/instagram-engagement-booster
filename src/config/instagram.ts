import dotenv from 'dotenv';
dotenv.config();

type InstagramConfig = {
  accessToken: string;
  pageId: string;
};

export const instagramConfig: InstagramConfig = {
  accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
  pageId: process.env.FACEBOOK_PAGE_ID || '',
};

// Validate config
if (!instagramConfig.accessToken) {
  throw new Error('FACEBOOK_ACCESS_TOKEN is required in .env file');
}

if (!instagramConfig.pageId) {
  throw new Error('FACEBOOK_PAGE_ID is required in .env file');
} 