import axios from 'axios';

type Comment = {
  message: string;
  from: {
    name: string;
    id: string;
  };
  comments?: {
    data: Comment[];
  };
  id: string;
  created_time?: string;
};

type Post = {
  comments?: {
    data: Comment[];
  };
  id: string;
};

type FacebookResponse = {
  posts?: {
    data: Post[];
    paging: {
      cursors: {
        before: string;
        after: string;
      };
      next?: string;
    };
  };
  data?: Post[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
};

type Message = {
  content: string;
  author: string;
  authorId: string;
  timestamp?: string;
};

type Conversation = {
  messages: Message[];
  postId: string;
  commentId: string;
};

export class InstagramService {
  private baseUrl = 'https://graph.facebook.com/v21.0';
  private pageId: string;
  private accessToken: string;

  constructor() {
    this.pageId = '';
    this.accessToken = '';
  }

  async initialize() {
    const response = await axios.get('/api/auth/instagram/status');
    if (!response.data.connected) {
      throw new Error('Instagram not connected');
    }
    this.pageId = response.data.pageId;

    // Get the access token
    const tokenResponse = await axios.get('/api/auth/instagram/token');
    this.accessToken = tokenResponse.data.accessToken;
  }

  async fetchAllComments(): Promise<Conversation[]> {
    if (!this.pageId || !this.accessToken) {
      await this.initialize();
    }

    let allConversations: Conversation[] = [];
    let nextPageUrl = `${this.baseUrl}/${this.pageId}?fields=posts{comments{from,message,created_time,comments{from,message,created_time}}}&access_token=${this.accessToken}`;

    while (nextPageUrl) {
      try {
        const response = await axios.get<FacebookResponse>(nextPageUrl);

        // Handle both initial and paginated response formats
        const posts = nextPageUrl.includes('after=')
          ? response?.data?.data?.filter(post => post.comments?.data?.length)
          : response?.data?.posts?.data?.filter(
              post => post.comments?.data?.length
            );

        if (!posts) {
          console.warn('No posts found in response');
          break;
        }

        console.log(`Processing ${posts.length} posts with comments`);

        for (const post of posts) {
          try {
            const conversations = this.processPostComments(post);
            if (conversations && conversations.length > 0) {
              allConversations = [...allConversations, ...conversations];
            }
          } catch (error) {
            console.error(`Error processing post ${post.id}:`, error);
            continue;
          }
        }

        // Handle pagination for both response formats
        nextPageUrl = nextPageUrl.includes('after=')
          ? response?.data?.paging?.next || ''
          : response?.data?.posts?.paging?.next || '';

        console.log(
          `Processed batch. Current total conversations: ${allConversations.length}`
        );
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error details:', error.response?.data);
        }
        console.error('Error fetching comments:', error);
        break;
      }
    }

    const validConversations = allConversations.filter(
      conv => conv.messages.length > 1
    );
    console.log(
      `Final number of valid conversations: ${validConversations.length}`
    );

    return validConversations;
  }

  private processPostComments(post: Post): Conversation[] {
    const conversations: Conversation[] = [];

    post.comments?.data.forEach(initialComment => {
      const messages: Message[] = [];

      // Add the initial comment (from another user)
      if (initialComment.message) {
        messages.push({
          content: initialComment.message,
          author: initialComment.from?.name || 'Unknown User',
          authorId: initialComment.from?.id || 'unknown',
          timestamp: initialComment.created_time,
        });
      }

      // Add all replies in chronological order
      if (initialComment.comments?.data) {
        initialComment.comments.data
          .sort((a, b) =>
            (a.created_time || '').localeCompare(b.created_time || '')
          )
          .forEach(reply => {
            const isPageOwnerMessage = !!reply.from;

            messages.push({
              content: reply.message,
              author: isPageOwnerMessage ? reply.from.name : 'Unknown User',
              authorId: isPageOwnerMessage ? reply.from.id : 'unknown',
              timestamp: reply.created_time,
            });
          });
      }

      // Only include conversations that have responses from the page owner
      if (
        messages.length > 1 &&
        messages.some(msg => msg.authorId === this.pageId)
      ) {
        conversations.push({
          messages,
          postId: post.id,
          commentId: initialComment.id,
        });
      }
    });

    return conversations;
  }
}
