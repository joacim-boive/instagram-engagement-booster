'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import type { UserSettings } from '@/services/settingsService';

export const isSettingsValid = (settings: UserSettings | null): boolean => {
  if (!settings) return false;
  return Boolean(settings.facebookPageId && settings.userPrompt);
};

type SettingsContextType = {
  settings: UserSettings | null;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
  initializeDefaultSettings: () => Promise<void>;
  isValid: boolean;
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
      const { data } = await axios.post('/api/settings', {
        name: 'Default Configuration',
        aiProvider: 'openai',
      });
      setSettings(data);
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
      const { data } = await axios.get('/api/settings');

      if (!data) {
        await initializeDefaultSettings();
        return;
      }

      setSettings(data);
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

  const isValid = isSettingsValid(settings);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        refreshSettings,
        isLoading,
        initializeDefaultSettings,
        isValid,
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
