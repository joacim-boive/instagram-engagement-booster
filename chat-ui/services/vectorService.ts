import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { env } from '../app/config/env';
import type { Conversation } from '@/services/ai/types';

// Vector service configuration
const VECTOR_CONFIG = {
  // Batch processing
  BATCH_SIZE: 100,

  // Embedding model
  EMBEDDING_MODEL: 'text-embedding-3-small',
  STRIP_NEWLINES: true,

  // Search parameters
  DEFAULT_LIMIT: 2,
  DEFAULT_SCORE_THRESHOLD: 0.5,

  // Content preview
  PREVIEW_LENGTH: 200,
} as const;

export class VectorService {
  private vectorStore: MemoryVectorStore | null = null;
  private embeddings: OpenAIEmbeddings;
  private conversationMap: Map<string, Conversation> = new Map();
  private initialized = false;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: env.openaiApiKey,
      modelName: VECTOR_CONFIG.EMBEDDING_MODEL,
      stripNewLines: VECTOR_CONFIG.STRIP_NEWLINES,
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
      for (let i = 0; i < conversations.length; i += VECTOR_CONFIG.BATCH_SIZE) {
        const batch = conversations.slice(i, i + VECTOR_CONFIG.BATCH_SIZE);
        const batchDocs = this.prepareBatchDocuments(batch);
        documents.push(...batchDocs);

        console.log(
          `Processed ${Math.min(i + VECTOR_CONFIG.BATCH_SIZE, conversations.length)} of ${conversations.length} conversations`
        );
      }

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
      // Separate user questions and your responses for clearer context
      const userQuestions = conv.messages
        .filter(msg => msg.authorId !== env.facebookPageId)
        .map(msg => msg.content);

      const yourResponses = conv.messages
        .filter(msg => msg.authorId === env.facebookPageId)
        .map(msg => msg.content);

      // Create a structured document with clear sections
      const text = [
        // Main question first for better matching
        userQuestions.length > 0 ? `Question: ${userQuestions[0]}` : '',

        // Your response provides context
        yourResponses.length > 0 ? `Answer: ${yourResponses[0]}` : '',

        // Additional context if there's more conversation
        userQuestions.length > 1 || yourResponses.length > 1
          ? 'Follow-up conversation:'
          : '',

        // Rest of the conversation
        ...conv.messages
          .slice(2)
          .map(
            msg =>
              `${msg.authorId === env.facebookPageId ? 'You' : 'User'}: ${msg.content}`
          ),

        // Add key topics or themes from the conversation
        this.extractKeyTopics(conv.messages),
      ]
        .filter(Boolean) // Remove empty strings
        .join('\n\n'); // Better spacing for text chunks

      return new Document({
        pageContent: text,
        metadata: {
          conversationId: conv.commentId,
          postId: conv.postId,
          messageCount: conv.messages.length,
          timestamp: conv.messages[0].timestamp,
          topics: this.extractKeyTopics(conv.messages), // Store topics in metadata
          hasQuestion: userQuestions.length > 0,
          hasResponse: yourResponses.length > 0,
        },
      });
    });
  }

  private extractKeyTopics(messages: Array<{ content: string }>): string {
    // Common topics in your conversations
    const topics = new Set<string>();

    const topicKeywords = {
      'prosthetic leg': ['leg', 'prosthetic', 'prosthesis', 'amputation'],
      motorcycle: [
        'bike',
        'motorcycle',
        'KTM',
        'SuperDuke',
        'enduro',
        'motocross',
        'SuperDuke 1290R',
        'Sherco',
        'Sherco 300',
        'twostroke',
        'two stroke',
        'fourstroke',
        'four stroke',
        'offroad',
        'riding',
        'ride',
      ],
      cancer: ['cancer', 'osteosarcoma', 'tumor'],
      inspiration: ['inspiration', 'inspiring', 'motivating'],
      medical: ['medical', 'hospital', 'treatment', 'surgery'],
    };

    const content = messages.map(m => m.content.toLowerCase()).join(' ');

    // Check for each topic
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        topics.add(topic);
      }
    }

    return Array.from(topics).join(', ');
  }

  async findSimilarConversations(
    query: string,
    limit = VECTOR_CONFIG.DEFAULT_LIMIT,
    scoreThreshold = VECTOR_CONFIG.DEFAULT_SCORE_THRESHOLD
  ): Promise<Array<{ conversation: Conversation; score: number }>> {
    if (!this.initialized || !this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    console.log(`[VectorService] Searching for: "${query}"`);
    console.log(
      `[VectorService] Parameters: limit=${limit}, threshold=${scoreThreshold}`
    );
    console.time('similarity-search');

    try {
      const results = await this.vectorStore.similaritySearchWithScore(
        query,
        limit
      );

      console.log('\n[VectorService] All matches:');
      results.forEach(([doc, score], index) => {
        console.log(`\n[VectorService] Raw Match ${index + 1}:`);
        console.log(
          `Score: ${score.toFixed(3)} ${score >= scoreThreshold ? '(✓ above threshold)' : '(✗ below threshold: ${scoreThreshold})'}`
        );
        console.log(
          `Content: ${doc.pageContent.slice(0, VECTOR_CONFIG.PREVIEW_LENGTH)}...`
        );
      });

      const filteredResults = results
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([_, score]) => score >= scoreThreshold)
        .map(([doc, score]) => ({
          conversation: this.conversationMap.get(doc.metadata.conversationId)!,
          score,
        }))
        .filter(result => result.conversation !== undefined);

      console.log(
        `[VectorService] Found ${results.length} total matches, ${filteredResults.length} above threshold`
      );
      filteredResults.forEach(({ conversation, score }, index) => {
        console.log(
          `[VectorService] Match ${index + 1}: Score=${score.toFixed(3)}`
        );
        console.log(
          `[VectorService] Content: ${conversation.messages[0].content.slice(0, 100)}...`
        );
      });

      return filteredResults;
    } catch (error) {
      console.error('[VectorService] Similarity search failed:', error);
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
