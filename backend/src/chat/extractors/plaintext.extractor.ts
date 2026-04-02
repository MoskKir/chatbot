import { Injectable } from '@nestjs/common';
import type { TextExtractor } from './text-extractor.interface';

@Injectable()
export class PlainTextExtractor implements TextExtractor {
  readonly supportedTypes = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
  ];

  async extract(buffer: Buffer): Promise<string> {
    return buffer.toString('utf-8');
  }
}
