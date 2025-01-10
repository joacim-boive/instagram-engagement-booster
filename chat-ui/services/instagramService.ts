import axios from 'axios';

export type InstagramPost = {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  caption?: string;
  comments: InstagramComment[];
};

export type InstagramComment = {
  id: string;
  text: string;
  timestamp: string;
  username: string;
  replies?: InstagramComment[];
  isFromPage?: boolean;
};

type InstagramMediaResponse = {
  data: {
    id: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
    caption?: string;
    comments?: {
      data: InstagramCommentResponse[];
    };
  }[];
};

type InstagramCommentResponse = {
  id: string;
  text: string;
  timestamp: string;
  username: string;
  from?: {
    id: string;
  };
  replies?: {
    data: InstagramCommentResponse[];
  };
};

export class InstagramService {
  private accessToken: string;
  private pageId: string;

  constructor(accessToken: string, pageId: string) {
    this.accessToken = accessToken;
    this.pageId = pageId;
  }

  async getRecentPosts(limit = 100): Promise<InstagramPost[]> {
    try {
      const mediaResponse = await axios.get<InstagramMediaResponse>(
        `https://graph.facebook.com/v21.0/${this.pageId}/media`,
        {
          params: {
            fields:
              'id,media_type,media_url,thumbnail_url,permalink,timestamp,caption,comments{id,text,timestamp,username,replies{id,text,timestamp,username}}',
            limit,
            access_token: this.accessToken,
          },
        }
      );

      return mediaResponse.data.data.map(post => ({
        id: post.id,
        media_type: post.media_type,
        media_url: post.media_url,
        thumbnail_url: post.thumbnail_url,
        permalink: post.permalink,
        timestamp: post.timestamp,
        caption: post.caption,
        comments: this.processComments(post.comments?.data || [], this.pageId),
      }));
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      throw error;
    }
  }

  private processComments(
    comments: InstagramCommentResponse[],
    instagramAccountId: string
  ): InstagramComment[] {
    return comments.map(comment => ({
      id: comment.id,
      text: comment.text,
      timestamp: comment.timestamp,
      username: comment.username,
      isFromPage: comment.from?.id === instagramAccountId,
      replies: comment.replies?.data
        ? this.processComments(comment.replies.data, instagramAccountId)
        : undefined,
    }));
  }
}
