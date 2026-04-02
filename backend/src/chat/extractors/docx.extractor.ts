import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import type { TextExtractor } from './text-extractor.interface';

@Injectable()
export class DocxExtractor implements TextExtractor {
  readonly supportedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  async extract(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}
