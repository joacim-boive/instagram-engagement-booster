'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserSettings } from '@/services/ai/types';

export default function SettingsPage() {
  const { isLoaded, userId, isSignedIn } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserSettings>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth/signin');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (userId) {
      const fetchSettings = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/settings');
          if (!response.ok) throw new Error('Failed to fetch settings');
          const data = await response.json();
          setSettings(data);
          if (data.length > 0 && !selectedId) {
            setSelectedId(data[0].id);
            setEditForm(data[0]);
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchSettings();
    }
  }, [userId, selectedId]);

  const handleCreateSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Configuration' }),
      });
      if (!response.ok) throw new Error('Failed to create settings');
      const newSettings = await response.json();
      setSettings(prev => [...prev, newSettings]);
      setSelectedId(newSettings.id);
      setEditForm(newSettings);
      setIsEditing(true);
    } catch (error) {
      console.error('Error creating settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedId) return;
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, updates: editForm }),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      const updatedSettings = await response.json();
      setSettings(prev =>
        prev.map(s => (s.id === selectedId ? updatedSettings : s))
      );
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSettings = async () => {
    if (!selectedId) return;
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId }),
      });
      if (!response.ok) throw new Error('Failed to delete settings');
      setSettings(prev => prev.filter(s => s.id !== selectedId));
      if (settings.length > 1) {
        const newSelectedId = settings.find(s => s.id !== selectedId)?.id;
        setSelectedId(newSelectedId);
        setEditForm(settings.find(s => s.id === newSelectedId) || {});
      } else {
        setSelectedId(undefined);
        setEditForm({});
      }
    } catch (error) {
      console.error('Error deleting settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSettings = settings.find(s => s.id === selectedId);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button onClick={handleCreateSettings} disabled={isLoading}>
            Create New
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Settings List */}
          <div className="space-y-4">
            <Label>Configurations</Label>
            <Select
              value={selectedId}
              onValueChange={value => {
                setSelectedId(value);
                setEditForm(settings.find(s => s.id === value) || {});
                setIsEditing(false);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select configuration" />
              </SelectTrigger>
              <SelectContent>
                {settings.map(setting => (
                  <SelectItem key={setting.id} value={setting.id}>
                    {setting.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Settings Form */}
          <div className="md:col-span-3 space-y-6">
            {selectedSettings && (
              <>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editForm.name || ''}
                    onChange={e =>
                      setEditForm(prev => ({ ...prev, name: e.target.value }))
                    }
                    disabled={!isEditing || isLoading}
                  />
                </div>

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
                  />
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
                      />
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
                      />
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
                      />
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
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditForm(selectedSettings);
                          setIsEditing(false);
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateSettings}
                        disabled={isLoading}
                      >
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleDeleteSettings}
                        disabled={isLoading}
                      >
                        Delete
                      </Button>
                      <Button
                        onClick={() => setIsEditing(true)}
                        disabled={isLoading}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
