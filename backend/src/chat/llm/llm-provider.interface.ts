export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: any }>;
}

export interface LlmStreamOptions {
  model: string;
  messages: LlmMessage[];
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
}

export interface LlmProvider {
  streamCompletion(options: LlmStreamOptions): Promise<string>;
}

export const LLM_PROVIDER = 'LLM_PROVIDER';
