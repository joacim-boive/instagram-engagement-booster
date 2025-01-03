import { NextRequest, NextResponse } from 'next/server';
import {
  getUserSettings,
  createUserSettings,
  updateUserSettings,
  deleteUserSettings,
} from '@/services/settingsService';

export async function GET() {
  try {
    const settings = await getUserSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const settings = await createUserSettings(name);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to create settings:', error);
    return NextResponse.json(
      { error: 'Failed to create settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json(
        { error: 'ID and updates are required' },
        { status: 400 }
      );
    }

    const settings = await updateUserSettings(id, updates);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await deleteUserSettings(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete settings' },
      { status: 500 }
    );
  }
}
