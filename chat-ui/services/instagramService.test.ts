import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstagramService } from './instagramService';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('InstagramService', () => {
  const mockAccessToken = 'mock-access-token';
  const mockInstagramHandle = 'mock.handle';
  const mockBusinessAccountId = 'mock-business-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with access token and instagram handle', () => {
      const service = new InstagramService(
        mockAccessToken,
        mockInstagramHandle
      );
      expect(service).toBeInstanceOf(InstagramService);
    });
  });

  describe('getInstagramBusinessAccountId', () => {
    it('should fetch and return business account ID', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          instagram_business_account: {
            id: mockBusinessAccountId,
          },
        },
      });

      const service = new InstagramService(
        mockAccessToken,
        mockInstagramHandle
      );
      // @ts-expect-error accessing private method for testing
      const businessId = await service.getInstagramBusinessAccountId();

      expect(businessId).toBe(mockBusinessAccountId);
      expect(axios.get).toHaveBeenCalledWith(
        `https://graph.facebook.com/v21.0/${mockInstagramHandle}`,
        {
          params: {
            fields: 'instagram_business_account',
            access_token: mockAccessToken,
          },
        }
      );
    });

    it('should throw error when business account ID is not found', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {},
      });

      const service = new InstagramService(
        mockAccessToken,
        mockInstagramHandle
      );
      // @ts-expect-error accessing private method for testing
      await expect(service.getInstagramBusinessAccountId()).rejects.toThrow(
        'Instagram Business Account ID not found'
      );
    });
  });

  describe('getRecentPosts', () => {
    const mockPosts = {
      data: [
        {
          id: 'post-1',
          media_type: 'IMAGE',
          media_url: 'https://example.com/image.jpg',
          permalink: 'https://instagram.com/p/123',
          timestamp: '2024-01-13T00:00:00Z',
          caption: 'Test post',
          comments: {
            data: [
              {
                id: 'comment-1',
                text: 'Nice post!',
                timestamp: '2024-01-13T00:01:00Z',
                username: 'user1',
                replies: {
                  data: [],
                },
              },
            ],
          },
        },
      ],
    };

    it('should fetch and return processed posts', async () => {
      vi.mocked(axios.get)
        .mockResolvedValueOnce({
          data: {
            instagram_business_account: {
              id: mockBusinessAccountId,
            },
          },
        })
        .mockResolvedValueOnce({ data: mockPosts });

      const service = new InstagramService(
        mockAccessToken,
        mockInstagramHandle
      );
      const posts = await service.getRecentPosts(1);

      expect(posts).toHaveLength(1);
      expect(posts[0]).toEqual({
        id: 'post-1',
        media_type: 'IMAGE',
        media_url: 'https://example.com/image.jpg',
        permalink: 'https://instagram.com/p/123',
        timestamp: '2024-01-13T00:00:00Z',
        caption: 'Test post',
        comments: [
          {
            id: 'comment-1',
            text: 'Nice post!',
            timestamp: '2024-01-13T00:01:00Z',
            username: 'user1',
            replies: [],
            isFromPage: false,
          },
        ],
      });
    });

    it('should handle errors when fetching posts', async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('API Error'));

      const service = new InstagramService(
        mockAccessToken,
        mockInstagramHandle
      );
      await expect(service.getRecentPosts()).rejects.toThrow('API Error');
    });
  });

  describe('processComments', () => {
    it('should process comments and identify page comments', () => {
      const service = new InstagramService(
        mockAccessToken,
        mockInstagramHandle
      );
      const mockComments = [
        {
          id: 'comment-1',
          text: 'Page response',
          timestamp: '2024-01-13T00:00:00Z',
          username: 'page_user',
          from: { id: mockInstagramHandle },
          replies: {
            data: [
              {
                id: 'reply-1',
                text: 'User reply',
                timestamp: '2024-01-13T00:01:00Z',
                username: 'user1',
              },
            ],
          },
        },
      ];

      // @ts-expect-error accessing private method for testing
      const processedComments = service.processComments(
        mockComments,
        mockInstagramHandle
      );

      expect(processedComments[0]).toEqual({
        id: 'comment-1',
        text: 'Page response',
        timestamp: '2024-01-13T00:00:00Z',
        username: 'page_user',
        isFromPage: true,
        replies: [
          {
            id: 'reply-1',
            text: 'User reply',
            timestamp: '2024-01-13T00:01:00Z',
            username: 'user1',
            isFromPage: false,
          },
        ],
      });
    });
  });

  describe('getConfigAndPosts', () => {
    it('should fetch config and posts successfully', async () => {
      const mockConfig = {
        data: {
          instagramHandle: mockInstagramHandle,
          instagramAccessToken: mockAccessToken,
        },
      };

      vi.mocked(axios.get)
        .mockResolvedValueOnce(mockConfig)
        .mockResolvedValueOnce({
          data: {
            instagram_business_account: {
              id: mockBusinessAccountId,
            },
          },
        })
        .mockResolvedValueOnce({ data: { data: [] } });

      const result = await InstagramService.getConfigAndPosts();

      expect(result).toEqual({
        posts: [],
      });
      expect(axios.get).toHaveBeenCalledWith('/api/instagram/config');
    });

    it('should return error when config is missing', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {},
      });

      const result = await InstagramService.getConfigAndPosts();

      expect(result).toEqual({
        posts: [],
        error: 'Please configure your Instagram credentials',
      });
    });

    it('should handle API errors', async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('API Error'));

      const result = await InstagramService.getConfigAndPosts();

      expect(result).toEqual({
        posts: [],
        error: 'Failed to load Instagram posts',
      });
    });
  });
});
