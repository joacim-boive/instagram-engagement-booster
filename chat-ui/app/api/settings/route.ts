import { NextResponse } from 'next/server';
import { SettingsService } from '@/services/settingsService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const settingsService = new SettingsService();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = settingsService.listSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    const settings = settingsService.createSettings(name);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to create settings:', error);
    return NextResponse.json(
      { error: 'Failed to create settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, updates } = await request.json();
    const settings = settingsService.updateSettings(id, updates);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    const success = settingsService.deleteSettings(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Failed to delete settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete settings' },
      { status: 500 }
    );
  }
}
