import { NextResponse } from 'next/server';
import { getMetaPageId } from '../shared';

export async function GET() {
  try {
    const pageId = getMetaPageId();
    return NextResponse.json({ pageId });
  } catch (error) {
    console.error('Error checking Meta auth status:', error);
    return NextResponse.json(
      { error: 'Failed to check Meta auth status' },
      { status: 500 }
    );
  }
}
