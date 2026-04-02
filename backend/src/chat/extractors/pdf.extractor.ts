import { Injectable } from '@nestjs/common';
import type { TextExtractor } from './text-extractor.interface';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

@Injectable()
export class PdfExtractor implements TextExtractor {
  readonly supportedTypes = ['application/pdf'];

  async extract(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
  }
}
