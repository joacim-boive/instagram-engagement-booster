'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type SettingsWarningProps = {
  onOpenSettings: () => void;
};

export function SettingsWarning({ onOpenSettings }: SettingsWarningProps) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Missing Required Settings</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Please configure your Facebook Page ID in settings</span>
        <Button variant="destructive" size="sm" onClick={onOpenSettings}>
          Configure Settings
        </Button>
      </AlertDescription>
    </Alert>
  );
}
