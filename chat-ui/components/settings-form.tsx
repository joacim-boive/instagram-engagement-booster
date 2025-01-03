'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { UserSettings } from '@/services/settingsService';
import { useSettings } from '@/contexts/SettingsContext';

export default function SettingsForm() {
  const { settings, refreshSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserSettings>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setEditForm(settings);
    }
  }, [settings]);

  const handleUpdateSettings = async () => {
    try {
      setIsLoading(true);
      if (!settings) {
        // Create new settings if none exist
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Default Configuration', ...editForm }),
        });
        if (!response.ok) throw new Error('Failed to create settings');
      } else {
        // Update existing settings
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: settings.id, updates: editForm }),
        });
        if (!response.ok) throw new Error('Failed to update settings');
      }
      await refreshSettings();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>System Prompt</Label>
        <Textarea
          value={editForm.systemPrompt || ''}
          onChange={e =>
            setEditForm(prev => ({
              ...prev,
              systemPrompt: e.target.value,
            }))
          }
          disabled={!isEditing || isLoading}
          rows={5}
          placeholder="Leave empty to use system default"
        />
        <p className="text-sm text-muted-foreground">
          The system prompt that guides the AIs behavior. Leave empty to use the
          default prompt.
        </p>
      </div>

      <div className="space-y-2">
        <Label>AI Provider</Label>
        <Select
          value={editForm.aiProvider}
          onValueChange={value =>
            setEditForm(prev => ({
              ...prev,
              aiProvider: value as 'openai' | 'anthropic',
            }))
          }
          disabled={!isEditing || isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {editForm.aiProvider === 'openai' && (
        <>
          <div className="space-y-2">
            <Label>OpenAI API Key</Label>
            <Input
              type="password"
              value={editForm.openaiApiKey || ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  openaiApiKey: e.target.value,
                }))
              }
              disabled={!isEditing || isLoading}
              placeholder="Leave empty to use system default"
            />
            <p className="text-sm text-muted-foreground">
              Your OpenAI API key. Leave empty to use the system default key.
            </p>
          </div>
          <div className="space-y-2">
            <Label>OpenAI Model</Label>
            <Input
              value={editForm.openaiModel || ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  openaiModel: e.target.value,
                }))
              }
              disabled={!isEditing || isLoading}
              placeholder="Leave empty to use system default"
            />
            <p className="text-sm text-muted-foreground">
              The OpenAI model to use (e.g., gpt-4-turbo-preview). Leave empty
              to use the system default model.
            </p>
          </div>
        </>
      )}

      {editForm.aiProvider === 'anthropic' && (
        <>
          <div className="space-y-2">
            <Label>Anthropic API Key</Label>
            <Input
              type="password"
              value={editForm.anthropicApiKey || ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  anthropicApiKey: e.target.value,
                }))
              }
              disabled={!isEditing || isLoading}
              placeholder="Leave empty to use system default"
            />
            <p className="text-sm text-muted-foreground">
              Your Anthropic API key. Leave empty to use the system default key.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Anthropic Model</Label>
            <Input
              value={editForm.anthropicModel || ''}
              onChange={e =>
                setEditForm(prev => ({
                  ...prev,
                  anthropicModel: e.target.value,
                }))
              }
              disabled={!isEditing || isLoading}
              placeholder="Leave empty to use system default"
            />
            <p className="text-sm text-muted-foreground">
              The Anthropic model to use (e.g., claude-3-opus-20240229). Leave
              empty to use the system default model.
            </p>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-4">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEditForm(settings || {});
                setIsEditing(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateSettings} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} disabled={isLoading}>
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
