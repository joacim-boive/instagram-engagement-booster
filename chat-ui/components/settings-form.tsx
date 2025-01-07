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
import { Loader2, HelpCircle } from 'lucide-react';
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
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
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
    if (settings) {
      form.reset({
        facebookPageId: settings.facebookPageId || '',
        userPrompt: settings.userPrompt || '',
        aiProvider: settings.aiProvider,
        openaiApiKey: settings.openaiApiKey || '',
        openaiModel: settings.openaiModel || defaultModels.openaiModel,
        anthropicApiKey: settings.anthropicApiKey || '',
        anthropicModel: settings.anthropicModel || defaultModels.anthropicModel,
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      if (!settings) {
        await axios.post('/api/settings', {
          name: 'Default Configuration',
          ...data,
        });
      } else {
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
      console.error('Error updating settings:', error);
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
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter your Facebook Page ID"
                  disabled={isSubmitting}
                />
              </FormControl>
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
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
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
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
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
                    The Anthropic model to use (e.g., claude-3-opus-20240229).
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
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
