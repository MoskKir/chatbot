import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmProvider, LlmStreamOptions } from './llm-provider.interface';

@Injectable()
export class OpenRouterProvider implements LlmProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);
  private readonly apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENROUTER_API_KEY', '');
  }

  async streamCompletion({
    model,
    messages,
    onChunk,
    signal,
  }: LlmStreamOptions): Promise<string> {
    let fullContent = '';

    try {
      const res = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, stream: true, messages }),
          signal,
        },
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter error ${res.status}: ${err}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          break;
        }
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              onChunk(delta);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      return fullContent || 'Sorry, I could not generate a response.';
    } catch (error) {
      this.logger.error(`OpenRouter API error for model ${model}: ${(error as Error).message}`);
      const safeMsg = 'Sorry, an error occurred while generating a response. Please try again.';
      if (!fullContent) onChunk(safeMsg);
      return fullContent || safeMsg;
    }
  }
}
