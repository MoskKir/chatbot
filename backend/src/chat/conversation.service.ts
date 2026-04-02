import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../auth/storage.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { truncateTitle } from '../common/types';
import type { Identity } from '../common/types';
import type { Role } from '@prisma/client';

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async getAll({ userId, anonId }: Identity) {
    const where = userId ? { userId } : { anonId };
    return this.prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 1 },
      },
    });
  }

  async getById(id: string, { userId, anonId }: Identity) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            documents: {
              select: {
                id: true,
                filename: true,
                storagePath: true,
                isImage: true,
                mimeType: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    if (userId && conversation.userId !== userId) {
      throw new ForbiddenException();
    }
    if (!userId && conversation.anonId !== anonId) {
      throw new ForbiddenException();
    }

    return {
      ...conversation,
      messages: await Promise.all(
        conversation.messages.map(async (m) => ({
          ...m,
          documents: await Promise.all(
            ((m as any).documents ?? []).map(async (d: any) => ({
              ...d,
              url: d.storagePath
                ? await this.storage.getSignedUrl(d.storagePath)
                : null,
            })),
          ),
        })),
      ),
    };
  }

  async verifyOwner(id: string, identity: Identity) {
    await this.getById(id, identity); // throws if not owner
  }

  async create(dto: CreateConversationDto, { userId, anonId }: Identity) {
    return this.prisma.conversation.create({
      data: {
        title: dto.title ?? 'New chat',
        userId,
        anonId: userId ? null : anonId,
      },
    });
  }

  async delete(id: string, identity: Identity) {
    await this.getById(id, identity);
    await this.prisma.conversation.delete({ where: { id } });
    return { deleted: true };
  }

  async updateTitle(id: string, title: string, identity: Identity) {
    await this.getById(id, identity); // ownership check
    return this.prisma.conversation.update({
      where: { id },
      data: { title },
    });
  }

  async addMessage(
    conversationId: string | undefined,
    content: string,
    role: Role,
    identity: Identity,
  ): Promise<{ message: any; conversationId: string }> {
    if (!conversationId) {
      const conversation = await this.create(
        { title: truncateTitle(content) },
        identity,
      );
      conversationId = conversation.id;
    }

    const message = await this.prisma.message.create({
      data: { role, content, conversationId },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return { message, conversationId };
  }
}
