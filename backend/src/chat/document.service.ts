import {
  Injectable,
  Inject,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../auth/storage.service';
import {
  TextExtractor,
  TEXT_EXTRACTORS,
} from './extractors/text-extractor.interface';
import type { Identity } from '../common/types';

const MAX_TEXT_LENGTH = 50_000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];

@Injectable()
export class DocumentService {
  private extractorMap: Map<string, TextExtractor>;

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    @Inject(TEXT_EXTRACTORS) extractors: TextExtractor[],
  ) {
    this.extractorMap = new Map();
    for (const extractor of extractors) {
      for (const type of extractor.supportedTypes) {
        this.extractorMap.set(type, extractor);
      }
    }
  }

  private isImage(mimeType: string): boolean {
    return IMAGE_TYPES.includes(mimeType);
  }

  private get supportedTypes(): string[] {
    return [...this.extractorMap.keys(), ...IMAGE_TYPES];
  }

  /** Verify that a conversation belongs to the given identity */
  private async verifyConversationOwner(
    conversationId: string,
    identity: Identity,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true, anonId: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (identity.userId && conv.userId !== identity.userId)
      throw new ForbiddenException();
    if (!identity.userId && conv.anonId !== identity.anonId)
      throw new ForbiddenException();
  }

  /** Verify that a document belongs to the given identity */
  private async verifyDocumentOwner(docId: string, identity: Identity) {
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
      select: { conversationId: true },
    });
    if (!doc) throw new NotFoundException('Document not found');
    await this.verifyConversationOwner(doc.conversationId, identity);
  }

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    const extractor = this.extractorMap.get(mimeType);
    if (!extractor) return '';

    let text = await extractor.extract(buffer);
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH) + '\n\n[... truncated]';
    }
    return text;
  }

  async upload(
    file: Express.Multer.File,
    conversationId: string,
    identity: Identity,
    messageId?: string,
  ) {
    await this.verifyConversationOwner(conversationId, identity);

    if (
      !this.supportedTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Supported: ${this.supportedTypes.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File too large. Max 10MB.');
    }

    const isImg = this.isImage(file.mimetype);
    const ext = file.originalname.split('.').pop() || 'bin';
    const storagePath = `${conversationId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const publicUrl = await this.storage.uploadFile(
      storagePath,
      file.buffer,
      file.mimetype,
    );

    let textContent = '';
    if (!isImg) {
      textContent = await this.extractText(file.buffer, file.mimetype);
    }

    const doc = await this.prisma.document.create({
      data: {
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        textContent,
        storagePath,
        isImage: isImg,
        conversationId,
        messageId: messageId || null,
      },
    });

    return { ...doc, url: publicUrl };
  }

  async linkToMessage(documentIds: string[], messageId: string) {
    await this.prisma.document.updateMany({
      where: { id: { in: documentIds } },
      data: { messageId },
    });
  }

  async linkUnlinkedToMessage(conversationId: string, messageId: string) {
    const result = await this.prisma.document.updateMany({
      where: { conversationId, messageId: null },
      data: { messageId },
    });
    return result.count;
  }

  async getByConversation(conversationId: string, identity: Identity) {
    await this.verifyConversationOwner(conversationId, identity);
    const docs = await this.prisma.document.findMany({
      where: { conversationId },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        isImage: true,
        storagePath: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      docs.map(async (d) => ({
        ...d,
        url: d.storagePath ? await this.storage.getSignedUrl(d.storagePath) : null,
      })),
    );
  }

  async getTextForConversation(conversationId: string): Promise<string> {
    const docs = await this.prisma.document.findMany({
      where: { conversationId, isImage: false },
      select: { filename: true, textContent: true },
      orderBy: { createdAt: 'asc' },
    });

    if (docs.length === 0) return '';

    return docs
      .map((d) => `--- Document: ${d.filename} ---\n${d.textContent}`)
      .join('\n\n');
  }

  async getImagesForConversation(
    conversationId: string,
  ): Promise<{ filename: string; url: string }[]> {
    const docs = await this.prisma.document.findMany({
      where: { conversationId, isImage: true },
      select: { filename: true, storagePath: true },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      docs
        .filter((d) => d.storagePath)
        .map(async (d) => ({
          filename: d.filename,
          url: await this.storage.getSignedUrl(d.storagePath!),
        })),
    );
  }

  async getFileUrl(id: string, identity: Identity): Promise<string | null> {
    await this.verifyDocumentOwner(id, identity);
    const doc = await this.prisma.document.findUnique({
      where: { id },
      select: { storagePath: true },
    });
    if (!doc?.storagePath) return null;
    return this.storage.getSignedUrl(doc.storagePath);
  }

  async deleteDocument(id: string, identity: Identity) {
    await this.verifyDocumentOwner(id, identity);
    const doc = await this.prisma.document.findUnique({
      where: { id },
      select: { storagePath: true },
    });

    if (doc?.storagePath) {
      await this.storage.deleteFile(doc.storagePath);
    }

    await this.prisma.document.delete({ where: { id } });
    return { deleted: true };
  }
}
