import { NextResponse } from 'next/server';
import { getAiService } from '@/lib/singleton';

export async function GET() {
  try {
    const aiService = getAiService();
    await aiService.initializeVectorStore();

    const stats = aiService.getStats();
    return NextResponse.json({
      status: stats.isInitialized ? 'initialized' : 'initializing',
      stats,
    });
  } catch (error) {
    console.error('Error in init API:', error);
    return NextResponse.json(
      { error: 'Initialization failed' },
      { status: 500 }
    );
  }
}
