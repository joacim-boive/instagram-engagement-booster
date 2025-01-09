'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, HelpCircle, Facebook } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui';
import { useSettings } from '@/contexts/SettingsContext';
import { defaultModels } from '@/config/client-config';
import {
  settingsSchema,
  type SettingsFormData,
} from '@/lib/validations/settings';
import { type ControllerRenderProps } from 'react-hook-form';

type FormFieldProps = ControllerRenderProps<SettingsFormData>;

type SettingsFormProps = {
  onClose: () => void;
};

export default function SettingsForm({ onClose }: SettingsFormProps) {
  const { settings, refreshSettings } = useSettings();
  const { toast } = useToast();
  console.log('SettingsForm rendered with settings:', settings);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings
      ? {
          facebookPageId: settings.facebookPageId || '',
          userPrompt: settings.userPrompt || '',
          aiProvider: settings.aiProvider || 'openai',
          openaiApiKey: settings.openaiApiKey || '',
          openaiModel: settings.openaiModel || defaultModels.openaiModel,
          anthropicApiKey: settings.anthropicApiKey || '',
          anthropicModel:
            settings.anthropicModel || defaultModels.anthropicModel,
        }
      : {
          facebookPageId: '',
          userPrompt: '',
          aiProvider: 'openai',
          openaiApiKey: '',
          openaiModel: defaultModels.openaiModel,
          anthropicApiKey: '',
          anthropicModel: defaultModels.anthropicModel,
        },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    console.log('Settings changed in form:', settings);
    if (settings) {
      console.log('Resetting form with settings:', settings);
      const formData = {
        facebookPageId: settings.facebookPageId || '',
        userPrompt: settings.userPrompt || '',
        aiProvider: settings.aiProvider || 'openai',
        openaiApiKey: settings.openaiApiKey || '',
        openaiModel: settings.openaiModel || defaultModels.openaiModel,
        anthropicApiKey: settings.anthropicApiKey || '',
        anthropicModel: settings.anthropicModel || defaultModels.anthropicModel,
      };
      console.log('Form data to set:', formData);
      form.reset(formData);
    }
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormData) => {
    console.log('Submitting form with data:', data);
    try {
      if (!settings) {
        console.log('Creating new settings');
        await axios.post('/api/settings', {
          name: 'Default Configuration',
          ...data,
        });
      } else {
        console.log('Updating existing settings:', settings.id);
        await axios.put('/api/settings', {
          id: settings.id,
          updates: data,
        });
      }
      await refreshSettings();
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully.',
        duration: 3000,
        variant: 'info',
      });
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="facebookPageId"
          render={({ field }: { field: FormFieldProps }) => (
            <FormItem>
              <FormLabel>
                Facebook Page ID <span className="text-red-500">*</span>
              </FormLabel>
              <div className="space-y-2">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter your Facebook Page ID"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await axios.post('/api/auth/meta/init');
                      window.open(
                        response.data.authUrl,
                        '_blank',
                        'width=600,height=800'
                      );

                      // Poll for completion
                      const interval = setInterval(async () => {
                        try {
                          const statusResponse = await axios.get(
                            '/api/auth/meta/status'
                          );
                          if (statusResponse.data.pageId) {
                            clearInterval(interval);
                            form.setValue(
                              'facebookPageId',
                              statusResponse.data.pageId
                            );
                            toast({
                              title: 'Success',
                              description:
                                'Facebook Page ID retrieved successfully.',
                              variant: 'info',
                            });
                          }
                        } catch (error) {
                          console.error('Error checking auth status:', error);
                        }
                      }, 2000);

                      // Clear interval after 2 minutes
                      setTimeout(() => clearInterval(interval), 120000);
                    } catch (error) {
                      console.error('Error initiating Meta auth:', error);
                      toast({
                        title: 'Error',
                        description:
                          'Failed to connect to Meta. Please try again.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Connect Meta Account
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Required. Your Facebook Page ID is needed to interact with your
                page.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="userPrompt"
          render={({ field }: { field: FormFieldProps }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Personal Details <span className="text-red-500">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Add personal details that will be combined with the
                        system prompt. Start with &ldquo;Things to know about
                        me:&rdquo; and list key information about yourself.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={5}
                  placeholder="Things to know about me:"
                  disabled={isSubmitting}
                />
              </FormControl>
              <p className="text-sm text-muted-foreground">
                Required. This information will be combined with the system
                prompt to personalize responses.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="aiProvider"
          render={({ field }: { field: FormFieldProps }) => (
            <FormItem>
              <FormLabel>AI Provider</FormLabel>
              <Select
                defaultValue={settings?.aiProvider || 'openai'}
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue>
                      {field.value === 'openai' ? 'OpenAI' : 'Anthropic'}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('aiProvider') === 'openai' && (
          <>
            <FormField
              control={form.control}
              name="openaiApiKey"
              render={({ field }: { field: FormFieldProps }) => (
                <FormItem>
                  <FormLabel>OpenAI API Key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Leave empty to use system default"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Your OpenAI API key. Leave empty to use the system default
                    key.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="openaiModel"
              render={({ field }: { field: FormFieldProps }) => (
                <FormItem>
                  <FormLabel>OpenAI Model</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Leave empty to use system default"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    The OpenAI model to use (e.g., gpt-4o-mini). Leave empty to
                    use the system default model.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {form.watch('aiProvider') === 'anthropic' && (
          <>
            <FormField
              control={form.control}
              name="anthropicApiKey"
              render={({ field }: { field: FormFieldProps }) => (
                <FormItem>
                  <FormLabel>Anthropic API Key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Leave empty to use system default"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Your Anthropic API key. Leave empty to use the system
                    default key.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="anthropicModel"
              render={({ field }: { field: FormFieldProps }) => (
                <FormItem>
                  <FormLabel>Anthropic Model</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Leave empty to use system default"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    The Anthropic model to use (e.g., claude-3-sonnet-20241022).
                    Leave empty to use the system default model.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
