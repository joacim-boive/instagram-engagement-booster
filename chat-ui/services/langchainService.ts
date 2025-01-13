import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import type { UserSettings } from '@/types/settings';
import { serverEnv } from '@/config/server-env';
import type { Conversation } from './ai/types';
import { readFileSync } from 'fs';
import { join } from 'path';

// Vector service configuration
const VECTOR_CONFIG = {
  BATCH_SIZE: 100,
  EMBEDDING_MODEL: 'text-embedding-3-small',
  STRIP_NEWLINES: true,
  DEFAULT_LIMIT: 2,
  DEFAULT_SCORE_THRESHOLD: 0.5,
  PREVIEW_LENGTH: 200,
} as const;

export class LangChainService {
  private model: BaseChatModel;
  private systemPrompt: string;
  private vectorStore: MemoryVectorStore | null = null;
  private embeddings: OpenAIEmbeddings;
  private conversationMap: Map<string, Conversation>;
  private initialized = false;
  private isInitializing = false;
  private pageId: string;

  constructor(settings?: UserSettings | null) {
    console.log('LangChain: Constructing service with settings:', settings);

    // Load system prompt from system-prompt.txt
    try {
      const systemPromptPath = join(
        process.cwd(),
        'prompts',
        'system-prompt.txt'
      );
      const fileContent = readFileSync(systemPromptPath, 'utf-8');
      console.log('LangChain: Using system prompt from file:', fileContent);
      this.systemPrompt = fileContent;

      // Append user prompt if available
      if (settings?.userPrompt) {
        this.systemPrompt += '\n\n' + settings.userPrompt;
      }
    } catch (error) {
      console.error(
        'LangChain: Failed to load system prompt from file:',
        error
      );
      throw new Error(
        'Failed to load system prompt. Please ensure system-prompt.txt exists.'
      );
    }

    this.pageId = settings?.facebookPageId || '';
    this.conversationMap = new Map();

    // Initialize embeddings
    console.log(
      'LangChain: Initializing embeddings with OpenAI key:',
      !!serverEnv.openaiApiKey
    );
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: serverEnv.openaiApiKey,
      modelName: VECTOR_CONFIG.EMBEDDING_MODEL,
      stripNewLines: VECTOR_CONFIG.STRIP_NEWLINES,
    });

    // Initialize the chat model
    if (settings?.aiProvider === 'anthropic' && serverEnv.anthropicApiKey) {
      console.log(
        'LangChain: Using Anthropic model:',
        settings.anthropicModel || serverEnv.anthropicModel
      );
      this.model = new ChatAnthropic({
        apiKey: settings.anthropicApiKey || serverEnv.anthropicApiKey,
        modelName: settings.anthropicModel || serverEnv.anthropicModel,
      });
    } else {
      console.log(
        'LangChain: Using OpenAI model:',
        settings?.openaiModel || serverEnv.openaiModel
      );
      console.log(
        'LangChain: OpenAI API key present:',
        !!serverEnv.openaiApiKey
      );
      this.model = new ChatOpenAI({
        apiKey: settings?.openaiApiKey || serverEnv.openaiApiKey,
        modelName: settings?.openaiModel || serverEnv.openaiModel,
        streaming: true,
        temperature: 0.7,
      });
    }

    // Initialize vector store with training data
    this.initializeVectorStore().catch(error => {
      console.error('LangChain: Failed to initialize vector store:', error);
    });
  }

  async streamingChat(
    message: string,
    onToken: (token: string) => void
  ): Promise<void> {
    console.log('LangChain: Starting streaming chat');
    console.log('LangChain: Getting relevant examples for:', message);
    const relevantExamples = await this.getRelevantExamples(message);
    console.log('LangChain: Found relevant examples:', relevantExamples);

    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...relevantExamples.map(example => ({
        role: 'assistant',
        content: example,
      })),
      { role: 'human', content: message },
    ];
    console.log('LangChain: Prepared messages:', messages);

    try {
      console.log('LangChain: Starting stream');
      const stream = await this.model.stream(messages);

      for await (const chunk of stream) {
        if (chunk.content) {
          let token = '';
          if (typeof chunk.content === 'string') {
            token = chunk.content;
          } else if (Array.isArray(chunk.content)) {
            token = chunk.content.filter(c => typeof c === 'string').join('');
          }
          if (token) {
            onToken(token);
          }
        }
      }

      console.log('LangChain: Stream completed successfully');
    } catch (error) {
      console.error('LangChain: Stream error:', error);
      throw error;
    }
  }

  async chat(message: string): Promise<string> {
    const relevantExamples = await this.getRelevantExamples(message);
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...relevantExamples.map(example => ({
        role: 'assistant',
        content: example,
      })),
      { role: 'human', content: '{input}' },
    ];

    const prompt = ChatPromptTemplate.fromMessages(messages);
    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());

    return chain.invoke({
      input: message,
    });
  }

  async initializeVectorStore(conversations?: Conversation[]): Promise<void> {
    if (this.isInitializing || this.initialized) {
      return;
    }

    try {
      this.isInitializing = true;
      console.log('LangChain: Initializing vector store');

      let trainingData: Conversation[] = [];
      if (conversations) {
        console.log('LangChain: Using provided conversations:', {
          conversationCount: conversations.length,
        });
        trainingData = conversations;
      } else {
        // Load training data from file
        const trainingDataPath = join(process.cwd(), 'training-data.json');
        trainingData = JSON.parse(readFileSync(trainingDataPath, 'utf-8'));
        console.log('LangChain: Loaded training data from file:', {
          conversationCount: trainingData.length,
        });
      }

      // Convert conversations to documents
      const documents = this.prepareBatchDocuments(trainingData);
      console.log('LangChain: Prepared documents:', {
        documentCount: documents.length,
      });

      // Create and populate vector store
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        documents,
        this.embeddings
      );
      console.log('LangChain: Vector store initialized');

      this.initialized = true;
      this.isInitializing = false;

      // Store conversations in memory for future reference
      trainingData.forEach(conv => {
        this.conversationMap.set(conv.commentId, conv);
      });
    } catch (error) {
      this.isInitializing = false;
      console.error('LangChain: Vector store initialization failed:', error);
      throw error;
    }
  }

  private prepareBatchDocuments(conversations: Conversation[]): Document[] {
    return conversations.map(conv => {
      const userQuestions = conv.messages
        .filter(msg => msg.authorId !== this.pageId)
        .map(msg => msg.content);

      const yourResponses = conv.messages
        .filter(msg => msg.authorId === this.pageId)
        .map(msg => msg.content);

      const text = [
        userQuestions.length > 0 ? `Question: ${userQuestions[0]}` : '',
        yourResponses.length > 0 ? `Answer: ${yourResponses[0]}` : '',
        userQuestions.length > 1 || yourResponses.length > 1
          ? 'Follow-up conversation:'
          : '',
        ...conv.messages
          .slice(2)
          .map(
            msg =>
              `${msg.authorId === this.pageId ? 'You' : 'User'}: ${msg.content}`
          ),
      ]
        .filter(Boolean)
        .join('\n\n');

      return new Document({
        pageContent: text,
        metadata: {
          conversationId: conv.commentId,
          postId: conv.postId,
          messageCount: conv.messages.length,
          timestamp: conv.messages[0].timestamp,
          hasQuestion: userQuestions.length > 0,
          hasResponse: yourResponses.length > 0,
        },
      });
    });
  }

  private async getRelevantExamples(query: string): Promise<string[]> {
    // Wait for initialization or initialize
    while (!this.initialized) {
      if (!this.isInitializing) {
        await this.initializeVectorStore();
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    return this.vectorStore
      .similaritySearchWithScore(query, VECTOR_CONFIG.DEFAULT_LIMIT)
      .then(results =>
        results.map(
          ([doc, score]) => `[Score: ${score.toFixed(3)}]\n${doc.pageContent}`
        )
      )
      .catch(error => {
        console.error('Error getting relevant examples:', error);
        return [];
      });
  }

  updateConfig(settings: UserSettings) {
    console.log('LangChain: Updating config with settings:', settings);

    // Load system prompt and append user prompt if available
    try {
      const systemPromptPath = join(
        process.cwd(),
        'prompts',
        'system-prompt.txt'
      );
      const fileContent = readFileSync(systemPromptPath, 'utf-8');
      this.systemPrompt = fileContent;
      if (settings.userPrompt) {
        this.systemPrompt += `\n\nThings to know about me:\n${settings.userPrompt} \n\nIf you don't find the answer in the above text always respond exactly like this: "I_DONT_KNOW"`;
      }
    } catch (error) {
      console.error('LangChain: Failed to update system prompt:', error);
    }

    this.pageId = settings.facebookPageId || this.pageId;

    if (settings.aiProvider === 'anthropic' && serverEnv.anthropicApiKey) {
      console.log(
        'LangChain: Updating to Anthropic model:',
        settings.anthropicModel || serverEnv.anthropicModel
      );
      this.model = new ChatAnthropic({
        apiKey: settings.anthropicApiKey || serverEnv.anthropicApiKey,
        modelName: settings.anthropicModel || serverEnv.anthropicModel,
      });
    } else {
      console.log(
        'LangChain: Updating to OpenAI model:',
        settings.openaiModel || serverEnv.openaiModel
      );
      this.model = new ChatOpenAI({
        apiKey: settings.openaiApiKey || serverEnv.openaiApiKey,
        modelName: settings.openaiModel || serverEnv.openaiModel,
        streaming: true,
        temperature: 0.7,
      });
    }
  }

  getStats() {
    return {
      initialized: this.initialized,
      isInitializing: this.isInitializing,
      conversationCount: this.conversationMap.size,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    };
  }
}
