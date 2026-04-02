import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'chatbot-files';
const SIGNED_URL_TTL = 60 * 60; // 1 hour in seconds

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: SupabaseClient;

  constructor(private config: ConfigService) {
    this.client = createClient(
      this.config.get<string>('SUPABASE_URL', ''),
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY', ''),
    );
  }

  async onModuleInit() {
    const { data } = await this.client.storage.getBucket(BUCKET);
    if (!data) {
      await this.client.storage.createBucket(BUCKET, { public: false });
      this.logger.log(`Created private storage bucket: ${BUCKET}`);
    }
  }

  async uploadFile(
    path: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    return this.getSignedUrl(path);
  }

  async deleteFile(path: string) {
    await this.client.storage.from(BUCKET).remove([path]);
  }

  /** Generate a time-limited signed URL for private file access */
  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);

    if (error || !data?.signedUrl) {
      this.logger.error(`Failed to create signed URL for ${path}: ${error?.message}`);
      return '';
    }
    return data.signedUrl;
  }

  /** @deprecated Use getSignedUrl instead. Kept for internal use only (e.g. LLM image URLs). */
  getPublicUrl(path: string): string {
    const { data } = this.client.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}
