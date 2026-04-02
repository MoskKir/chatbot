export interface TextExtractor {
  readonly supportedTypes: string[];
  extract(buffer: Buffer): Promise<string>;
}

export const TEXT_EXTRACTORS = 'TEXT_EXTRACTORS';
