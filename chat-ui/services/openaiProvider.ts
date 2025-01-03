import OpenAI from 'openai';
import { AiProvider, Message } from './ai/types';
import { AI_CONFIG } from './ai/constants';

export class OpenAiProvider implements AiProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = 'gpt-4-turbo-preview') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateResponse(messages: Message[]): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: AI_CONFIG.OPENAI.TEMPERATURE,
        max_tokens: AI_CONFIG.OPENAI.MAX_TOKENS,
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  async generateStreamingResponse(
    messages: Message[],
    onToken: (token: string) => void
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: AI_CONFIG.OPENAI.TEMPERATURE,
        max_tokens: AI_CONFIG.OPENAI.MAX_TOKENS,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          onToken(content);
        }
      }
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw new Error('Failed to generate streaming response from OpenAI');
    }
  }
}
