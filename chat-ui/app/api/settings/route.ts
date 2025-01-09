import { NextRequest, NextResponse } from 'next/server';
import {
  getUserSettings,
  createUserSettings,
  updateUserSettings,
  deleteUserSettings,
} from '@/services/settingsService';
import type { UserSettings } from '@/services/settingsService';

export async function GET() {
  try {
    console.log('GET /api/settings - Fetching settings');
    const settings = await getUserSettings();
    console.log('Settings retrieved:', settings);
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
    console.log('POST /api/settings - Creating settings');
    const body = await request.json();
    console.log('Request body:', body);
    const { name, ...otherSettings } = body as Partial<UserSettings>;

    if (!name) {
      console.log('Name is required');
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // For initial settings creation, don't require all fields
    const settings = await createUserSettings(name, {
      ...otherSettings,
      aiProvider: otherSettings.aiProvider || 'openai',
      userPrompt: otherSettings.userPrompt || '',
    });
    console.log('Settings created:', settings);

    return NextResponse.json(settings);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Settings already exist for this user'
    ) {
      console.log('Settings already exist for user');
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Failed to create settings:', error);
    return NextResponse.json(
      { error: 'Failed to create settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/settings - Updating settings');
    const body = await request.json();
    console.log('Request body:', body);
    const { updates } = body;

    // Get current settings to get the ID
    const currentSettings = await getUserSettings();
    if (!currentSettings) {
      console.log('Settings not found');
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    // Merge current settings with updates to validate the final state
    const finalSettings = {
      ...currentSettings,
      ...updates,
    };
    console.log('Final settings after merge:', finalSettings);

    if (!finalSettings.facebookPageId) {
      console.log('Facebook Page ID is required');
      return NextResponse.json(
        { error: 'Facebook Page ID is required' },
        { status: 400 }
      );
    }

    if (!finalSettings.userPrompt) {
      console.log('Personal Details are required');
      return NextResponse.json(
        { error: 'Personal Details are required' },
        { status: 400 }
      );
    }

    const settings = await updateUserSettings(currentSettings.id, updates);
    console.log('Settings updated:', settings);
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
