import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LangChainService } from './langchainService';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { readFileSync } from 'fs';
import type { UserSettings } from '@/types/settings';
import type { Conversation, TrainingMessage } from './ai/types';
import { AIMessageChunk } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// Mock all external dependencies
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(() => ({
    invoke: vi.fn(),
    stream: vi.fn(),
  })),
  OpenAIEmbeddings: vi.fn().mockImplementation(() => ({
    embedQuery: vi.fn(),
    embedDocuments: vi.fn(),
  })),
}));
vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn(),
}));
vi.mock('langchain/vectorstores/memory');
vi.mock('fs');
vi.mock('@langchain/core/output_parsers', () => ({
  StringOutputParser: vi.fn(() => ({
    pipe: vi.fn(),
  })),
}));
vi.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: {
    fromMessages: vi.fn().mockReturnValue({
      pipe: vi.fn().mockReturnValue({
        pipe: vi.fn().mockReturnValue({
          invoke: vi.fn().mockImplementation(async () => 'Mock response'),
        }),
      }),
    }),
  },
}));

describe('LangChainService', () => {
  const mockSystemPrompt = 'You are a helpful AI assistant.';
  const mockSettings: UserSettings = {
    id: 'test-settings',
    userId: 'test-user',
    name: 'Test Settings',
    aiProvider: 'openai' as const,
    openaiApiKey: 'test-openai-key',
    openaiModel: 'gpt-4',
    userPrompt: 'Custom user prompt',
    facebookPageId: 'test-page-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock MemoryVectorStore instance with the search method
    const mockVectorStore = new MemoryVectorStore(new OpenAIEmbeddings());
    mockVectorStore.similaritySearchWithScore = vi
      .fn()
      .mockResolvedValue([
        [{ pageContent: 'Similar example', metadata: {} }, 0.8],
      ]);

    // Mock the fromDocuments static method to return our mock instance
    vi.mocked(MemoryVectorStore.fromDocuments).mockResolvedValue(
      mockVectorStore
    );
  });

  describe('constructor', () => {
    it('should initialize with OpenAI by default', () => {
      // Mock system prompt read
      vi.mocked(readFileSync).mockReturnValueOnce(mockSystemPrompt);
      // Mock training data read
      vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify([]));

      new LangChainService(mockSettings);
      expect(ChatOpenAI).toHaveBeenCalled();
      expect(ChatAnthropic).not.toHaveBeenCalled();
    });

    it('should initialize with Anthropic when specified', () => {
      // Mock system prompt read
      vi.mocked(readFileSync).mockReturnValueOnce(mockSystemPrompt);
      // Mock training data read
      vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify([]));

      const anthropicSettings: UserSettings = {
        ...mockSettings,
        aiProvider: 'anthropic' as const,
        anthropicApiKey: 'test-anthropic-key',
        anthropicModel: 'claude-3-opus-20240229',
      };
      new LangChainService(anthropicSettings);
      expect(ChatAnthropic).toHaveBeenCalled();
      expect(ChatOpenAI).not.toHaveBeenCalled();
    });

    it('should load and combine system and user prompts', () => {
      // Mock system prompt read
      vi.mocked(readFileSync).mockReturnValueOnce(mockSystemPrompt);
      // Mock training data read
      vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify([]));

      new LangChainService(mockSettings);
      expect(readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('system-prompt.txt'),
        'utf-8'
      );
    });

    it('should handle missing system prompt file', () => {
      vi.mocked(readFileSync).mockImplementationOnce(() => {
        throw new Error('File not found');
      });
      // Mock training data read (won't be reached due to error)
      vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify([]));

      expect(() => new LangChainService(mockSettings)).toThrow(
        'Failed to load system prompt'
      );
    });
  });

  describe('chat', () => {
    it('should process chat messages with relevant examples', async () => {
      // Mock system prompt and training data reads
      vi.mocked(readFileSync).mockReturnValueOnce(mockSystemPrompt);
      vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify([]));

      const mockResponse = 'Mock response';
      const service = new LangChainService(mockSettings);
      const response = await service.chat('Test message');
      expect(response).toBe(mockResponse);
    });

    it('should handle chat errors', async () => {
      // Mock system prompt and training data reads
      vi.mocked(readFileSync).mockReturnValueOnce(mockSystemPrompt);
      vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify([]));

      // Mock ChatPromptTemplate to reject for this test
      // @ts-expect-error Complex LangChain types
      vi.mocked(ChatPromptTemplate.fromMessages).mockReturnValueOnce({
        pipe: vi.fn().mockReturnValue({
          pipe: vi.fn().mockReturnValue({
            invoke: vi.fn().mockRejectedValue(new Error('API Error')),
          }),
        }),
      });

      const service = new LangChainService(mockSettings);
      await expect(service.chat('Test message')).rejects.toThrow('API Error');
    });
  });

  describe('streamingChat', () => {
    it('should stream chat responses', async () => {
      // Mock system prompt and training data reads
      vi.mocked(readFileSync).mockReturnValueOnce(mockSystemPrompt);
      vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify([]));

      const mockStream = vi.fn();
      const mockTokens = ['Hello', ' world', '!'];

      // @ts-expect-error Complex LangChain types
      vi.mocked(ChatOpenAI).mockImplementation(() => ({
        invoke: vi.fn(),
        stream: mockStream.mockResolvedValue({
          async *[Symbol.asyncIterator]() {
            for (const token of mockTokens) {
              yield new AIMessageChunk({ content: token });
            }
          },
        }),
      }));

      const service = new LangChainService(mockSettings);
      const onToken = vi.fn();
      await service.streamingChat('Test message', onToken);

      expect(onToken).toHaveBeenCalledTimes(mockTokens.length);
      mockTokens.forEach(token => {
        expect(onToken).toHaveBeenCalledWith(token);
      });
    });

    it('should handle streaming errors', async () => {
      // Mock system prompt and training data reads
      vi.mocked(readFileSync).mockReturnValueOnce(mockSystemPrompt);
      vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify([]));

      const mockStream = vi.fn();
      mockStream.mockRejectedValue(new Error('Stream Error'));

      // @ts-expect-error Complex LangChain types
      vi.mocked(ChatOpenAI).mockImplementation(() => ({
        invoke: vi.fn(),
        stream: mockStream,
      }));

      const service = new LangChainService(mockSettings);
      await expect(
        service.streamingChat('Test message', vi.fn())
      ).rejects.toThrow('Stream Error');
    });
  });

  describe('initializeVectorStore', () => {
    const mockConversations: Conversation[] = [
      {
        commentId: 'test-comment',
        postId: 'test-post',
        messages: [
          {
            authorId: 'user',
            content: 'Test question',
            timestamp: new Date().toISOString(),
            author: 'User',
          } as TrainingMessage,
          {
            authorId: 'page',
            content: 'Test answer',
            timestamp: new Date().toISOString(),
            author: 'Assistant',
          } as TrainingMessage,
        ],
      },
    ];

    it('should initialize vector store with provided conversations', async () => {
      // Mock system prompt and training data reads
      vi.mocked(readFileSync).mockReturnValueOnce(mockSystemPrompt);
      vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify([]));

      const service = new LangChainService(mockSettings);
      await service.initializeVectorStore(mockConversations);

      expect(MemoryVectorStore.fromDocuments).toHaveBeenCalled();
    });

    it('should load conversations from file when none provided', async () => {
      // Mock system prompt read
      vi.mocked(readFileSync).mockReturnValueOnce(mockSystemPrompt);
      // Mock training data read with actual conversations
      vi.mocked(readFileSync).mockReturnValueOnce(
        JSON.stringify(mockConversations)
      );

      const service = new LangChainService(mockSettings);
      await service.initializeVectorStore();

      expect(readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('training-data.json'),
        'utf-8'
      );
      expect(MemoryVectorStore.fromDocuments).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      let fileReadCount = 0;
      vi.mocked(readFileSync).mockImplementation(() => {
        fileReadCount++;
        if (fileReadCount === 1) {
          return mockSystemPrompt; // First call for system prompt
        }
        return JSON.stringify([]); // Second call for training data
      });

      const service = new LangChainService(mockSettings);
      // Clear the initialization state
      // @ts-expect-error accessing private property for testing
      service.initialized = false;
      // @ts-expect-error accessing private property for testing
      service.isInitializing = false;

      // Mock the rejection for vector store initialization
      vi.mocked(MemoryVectorStore.fromDocuments).mockRejectedValueOnce(
        new Error('Initialization Error')
      );

      await expect(service.initializeVectorStore()).rejects.toThrow(
        'Initialization Error'
      );
    });
  });

  describe('updateConfig', () => {
    it('should update service configuration', () => {
      // Mock system prompt and training data reads
      vi.mocked(readFileSync).mockReturnValueOnce(mockSystemPrompt);
      vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify([]));

      const service = new LangChainService(mockSettings);
      const newSettings: UserSettings = {
        ...mockSettings,
        aiProvider: 'anthropic' as const,
        anthropicApiKey: 'new-anthropic-key',
      };

      service.updateConfig(newSettings);
      expect(ChatAnthropic).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return service statistics', () => {
      // Mock system prompt and training data reads
      vi.mocked(readFileSync).mockReturnValueOnce(mockSystemPrompt);
      vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify([]));

      const service = new LangChainService(mockSettings);
      const stats = service.getStats();

      expect(stats).toEqual({
        conversationCount: expect.any(Number),
        initialized: expect.any(Boolean),
        isInitializing: expect.any(Boolean),
        memoryUsage: expect.any(Number),
      });
    });
  });
});
