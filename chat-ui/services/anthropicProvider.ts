import Anthropic from '@anthropic-ai/sdk';
import { AiProvider, Message } from './ai/types';
import { AI_CONFIG } from './ai/constants';

export class AnthropicProvider implements AiProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = 'claude-3-opus-20240229') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateResponse(messages: Message[]): Promise<string> {
    try {
      const formattedMessages = messages.map(msg => ({
        role:
          msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: msg.content,
      }));

      const response = await this.client.messages.create({
        model: this.model,
        messages: formattedMessages,
        max_tokens: AI_CONFIG.ANTHROPIC.MAX_TOKENS,
        temperature: AI_CONFIG.ANTHROPIC.TEMPERATURE,
      });

      if (response.content[0].type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      return response.content[0].text;
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error('Failed to generate response from Anthropic');
    }
  }

  async generateStreamingResponse(
    messages: Message[],
    onToken: (token: string) => void
  ): Promise<void> {
    try {
      const formattedMessages = messages.map(msg => ({
        role:
          msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: msg.content,
      }));

      const stream = await this.client.messages.create({
        model: this.model,
        messages: formattedMessages,
        max_tokens: AI_CONFIG.ANTHROPIC.MAX_TOKENS,
        temperature: AI_CONFIG.ANTHROPIC.TEMPERATURE,
        stream: true,
      });

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          onToken(chunk.delta.text);
        }
      }
    } catch (error) {
      console.error('Anthropic streaming error:', error);
      throw new Error('Failed to generate streaming response from Anthropic');
    }
  }
}
