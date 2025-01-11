'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SettingsWarning() {
  return (
    <Alert variant="destructive">
      <AlertTitle>Missing Required Settings</AlertTitle>
      <AlertDescription>
        Please configure your Facebook Page ID and Personal Details in settings
      </AlertDescription>
    </Alert>
  );
}
