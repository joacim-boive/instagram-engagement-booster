import axios from 'axios';
import { instagramConfig } from '../config/instagram.js';

type CommentData = {
  created_time: string;
  message: string;
  id: string;
};

type PostData = {
  id: string;
  comments?: {
    data: CommentData[];
    paging: {
      cursors: {
        before: string;
        after: string;
      };
    };
  };
};

type FacebookResponse = {
  posts: {
    data: PostData[];
    paging: {
      cursors: {
        before: string;
        after: string;
      };
      next?: string;
    };
  };
};

export class InstagramService {
  private baseUrl = 'https://graph.facebook.com/v21.0';
  
  async fetchPostsWithComments() {
    try {
      const response = await axios.get<FacebookResponse>(
        `${this.baseUrl}/${instagramConfig.pageId}`,
        {
          params: {
            fields: 'posts{comments}',
            access_token: instagramConfig.accessToken,
          },
        }
      );
      
      // Filter only posts with comments and flatten the data
      const commentsData = response.data.posts.data
        .filter(post => (post?.comments?.data?.length ?? 0) > 0)
        .flatMap(post => post.comments?.data.map(comment => ({
          postId: post.id,
          ...comment
        })) || []);

      return commentsData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.response?.data);
      }
      throw error;
    }
  }

  async fetchAllComments() {
    let allComments: any[] = [];
    let nextPageUrl = `${this.baseUrl}/${instagramConfig.pageId}?fields=posts{comments}&access_token=${instagramConfig.accessToken}`;

    while (nextPageUrl) {
      try {
        const response = await axios.get<FacebookResponse>(nextPageUrl);
        const newComments = response.data.posts.data
          .filter(post => (post?.comments?.data?.length ?? 0) > 0)
          .flatMap(post => post.comments?.data.map(comment => ({
            postId: post.id,
            ...comment
          })) || []);

        allComments = [...allComments, ...newComments];
        nextPageUrl = response.data.posts.paging.next || '';
      } catch (error) {
        console.error('Error fetching comments:', error);
        break;
      }
    }

    return allComments;
  }
} 