import { getAiService } from '@/lib/singleton';

// Initialize immediately
const initServer = async () => {
  try {
    console.log('Initializing AI service...');
    const aiService = getAiService();
    await aiService.initializeVectorStore();
    console.log('AI service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AI service:', error);
  }
};

// Run initialization
void initServer();
