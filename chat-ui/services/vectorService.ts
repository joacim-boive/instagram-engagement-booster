import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { env } from '../app/config/env';
import type { Conversation } from '@/services/ai/types';

export class VectorService {
  private vectorStore: MemoryVectorStore | null = null;
  private embeddings: OpenAIEmbeddings;
  private conversationMap: Map<string, Conversation> = new Map();
  private initialized = false;
  private BATCH_SIZE = 100; // Process 100 conversations at a time

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: env.openaiApiKey,
      modelName: 'text-embedding-3-small',
      stripNewLines: true, // Optimize token usage
    });
  }

  async initializeFromConversations(conversations: Conversation[]) {
    const timeLabel = 'vectorization-' + Date.now(); // Create unique label
    console.time(timeLabel);

    try {
      // Store conversations in memory for quick lookup
      conversations.forEach(conv => {
        this.conversationMap.set(conv.commentId, conv);
      });

      // Prepare documents in batches
      const documents: Document[] = [];
      for (let i = 0; i < conversations.length; i += this.BATCH_SIZE) {
        const batch = conversations.slice(i, i + this.BATCH_SIZE);
        const batchDocs = this.prepareBatchDocuments(batch);
        documents.push(...batchDocs);

        // Log progress
        console.log(
          `Processed ${Math.min(i + this.BATCH_SIZE, conversations.length)} of ${conversations.length} conversations`
        );
      }

      // Create vector store
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        documents,
        this.embeddings
      );

      this.initialized = true;
      console.log(`Vectorized ${documents.length} conversations`);
    } catch (error) {
      console.error('Vectorization failed:', error);
      throw error;
    } finally {
      console.timeEnd(timeLabel); // Use same unique label
    }
  }

  private prepareBatchDocuments(conversations: Conversation[]): Document[] {
    return conversations.map(conv => {
      // Combine messages with context
      const text = conv.messages
        .map(msg => {
          const role = msg.authorId === env.facebookPageId ? 'You' : 'User';
          return `${role}: ${msg.content}`;
        })
        .join('\n');

      // Add metadata for better retrieval
      return new Document({
        pageContent: text,
        metadata: {
          conversationId: conv.commentId,
          postId: conv.postId,
          messageCount: conv.messages.length,
          timestamp: conv.messages[0].timestamp, // First message timestamp
        },
      });
    });
  }

  async findSimilarConversations(
    query: string,
    limit = 2,
    scoreThreshold = 0.7
  ): Promise<Array<{ conversation: Conversation; score: number }>> {
    if (!this.initialized || !this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    console.time('similarity-search');
    try {
      const results = await this.vectorStore.similaritySearchWithScore(
        query,
        limit
      );

      return (
        results
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_, score]) => score >= scoreThreshold) // Only return relevant matches
          .map(([doc, score]) => ({
            conversation: this.conversationMap.get(
              doc.metadata.conversationId
            )!,
            score,
          }))
          .filter(result => result.conversation !== undefined)
      ); // Type safety
    } catch (error) {
      console.error('Similarity search failed:', error);
      return [];
    } finally {
      console.timeEnd('similarity-search');
    }
  }

  // Helper method to get stats about the vector store
  getStats() {
    return {
      initialized: this.initialized,
      conversationCount: this.conversationMap.size,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    };
  }
}
