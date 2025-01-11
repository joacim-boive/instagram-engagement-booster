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
import { Loader2, HelpCircle, Facebook, Instagram } from 'lucide-react';
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
          instagramHandle: settings.instagramHandle || '',
          instagramAccessToken: settings.instagramAccessToken || '',
          facebookPageId: settings.facebookPageId || '',
          userPrompt: settings.userPrompt || '',
          aiProvider: settings.aiProvider || 'openai',
          openaiApiKey: settings.openaiApiKey || '',
          openaiModel: settings.openaiModel || '',
          anthropicApiKey: settings.anthropicApiKey || '',
          anthropicModel: settings.anthropicModel || '',
        }
      : {
          instagramHandle: '',
          instagramAccessToken: '',
          facebookPageId: '',
          userPrompt: '',
          aiProvider: 'openai',
          openaiApiKey: '',
          openaiModel: '',
          anthropicApiKey: '',
          anthropicModel: '',
        },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (settings) {
      form.reset({
        aiProvider: settings.aiProvider,
        userPrompt: settings.userPrompt,
        openaiApiKey: settings.openaiApiKey,
        openaiModel: settings.openaiModel,
        anthropicApiKey: settings.anthropicApiKey,
        instagramHandle: settings.instagramHandle,
        instagramAccessToken: settings.instagramAccessToken,
        facebookPageId: settings.facebookPageId,
      });
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
        variant: 'success',
        title: 'Settings saved',
        description: 'Your settings have been updated successfully.',
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
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Instagram Connection</h3>
          <div className="flex items-center gap-2">
            <div className="flex-grow">
              {form.watch('instagramHandle') ? (
                <div className="text-sm text-muted-foreground">
                  Connected to Instagram: @{form.watch('instagramHandle')}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your Instagram handle (e.g. jboive)"
                    onChange={e =>
                      form.setValue('instagramHandle', e.target.value)
                    }
                    value={form.watch('instagramHandle') || ''}
                    className="flex-grow"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const handle = form.watch('instagramHandle');
                      if (!handle) {
                        toast({
                          title: 'Error',
                          description: 'Please enter your Instagram handle',
                          variant: 'destructive',
                        });
                        return;
                      }

                      try {
                        const response = await axios.post(
                          '/api/auth/instagram/init',
                          {
                            handle,
                          }
                        );
                        window.open(
                          response.data.authUrl,
                          '_blank',
                          'width=600,height=800'
                        );

                        // Poll for completion
                        const interval = setInterval(async () => {
                          try {
                            const statusResponse = await axios.get(
                              '/api/auth/instagram/status'
                            );
                            if (statusResponse.data.pageId) {
                              clearInterval(interval);
                              form.setValue(
                                'instagramHandle',
                                statusResponse.data.pageId
                              );
                              toast({
                                title: 'Success',
                                description:
                                  'Instagram connected successfully.',
                                variant: 'success',
                              });
                            }
                          } catch (error) {
                            console.error('Error checking auth status:', error);
                          }
                        }, 2000);

                        // Clear interval after 2 minutes
                        setTimeout(() => clearInterval(interval), 120000);
                      } catch (error) {
                        console.error('Error connecting to Instagram:', error);
                        toast({
                          title: 'Error',
                          description:
                            'Failed to connect to Instagram. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    <Instagram className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              )}
            </div>
            {form.watch('instagramHandle') && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.setValue('instagramHandle', '');
                  form.setValue('instagramAccessToken', '');
                }}
              >
                <Instagram className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>
        </div>

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
                              variant: 'success',
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
                    <TooltipTrigger asChild onClick={e => e.preventDefault()}>
                      <button
                        type="button"
                        className="hover:opacity-80"
                        onClick={e => e.stopPropagation()}
                      >
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </button>
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
                      type="text"
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
                      placeholder={defaultModels.openaiModel}
                      disabled={isSubmitting || !form.watch('openaiApiKey')}
                      onChange={e => {
                        if (!form.watch('openaiApiKey')) {
                          e.preventDefault();
                          return;
                        }
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    {!form.watch('openaiApiKey')
                      ? 'Provide your OpenAI API key to customize the model'
                      : 'The OpenAI model to use (e.g., gpt-4o-mini). Leave empty to use the system default model.'}
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
                      type="text"
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
                      placeholder={defaultModels.anthropicModel}
                      disabled={isSubmitting || !form.watch('anthropicApiKey')}
                      onChange={e => {
                        if (!form.watch('anthropicApiKey')) {
                          e.preventDefault();
                          return;
                        }
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    {!form.watch('anthropicApiKey')
                      ? 'Provide your Anthropic API key to customize the model'
                      : 'The Anthropic model to use (e.g., claude-3-5-haiku-20241022). Leave empty to use the system default model.'}
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
