import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { LangChainService } from '@/services/langchainService';
import { getUserSettings } from '@/services/settingsService';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const settings = await getUserSettings();

    // Initialize LangChain service
    const langchainService = new LangChainService(settings);

    // Return initialization status
    return NextResponse.json({
      initialized: true,
      stats: langchainService.getStats(),
    });
  } catch (error) {
    console.error('Failed to initialize:', error);
    return NextResponse.json(
      { error: 'Failed to initialize' },
      { status: 500 }
    );
  }
}
