'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@clerk/nextjs';
import type { UserSettings } from '@/services/settingsService';

// Define default settings
const defaultSettings: Omit<
  UserSettings,
  'userId' | 'id' | 'createdAt' | 'updatedAt'
> = {
  name: 'Default Configuration',
  aiProvider: 'openai',
};

type SettingsContextType = {
  settings: UserSettings | null;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
  initializeDefaultSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializeDefaultSettings = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...defaultSettings,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize settings');
      }

      const newSettings = await response.json();
      setSettings(newSettings);
    } catch (error) {
      console.error('Error initializing settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSettings = async () => {
    if (!isSignedIn || !userId) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/settings');

      if (!response.ok) {
        if (response.status === 401) {
          setSettings(null);
          return;
        }
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();

      // If no settings exist, initialize default settings
      if (!data || data.length === 0) {
        await initializeDefaultSettings();
        return;
      }

      setSettings(data[0]);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refreshSettings();
    }
  }, [isLoaded, isSignedIn]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        refreshSettings,
        isLoading,
        initializeDefaultSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
