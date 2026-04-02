import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ConversationService } from './conversation.service';
import { AnonRateLimitService } from './anon-rate-limit.service';
import { RateLimitService } from './rate-limit.service';
import { DocumentService } from './document.service';
import { IdentityService } from '../common/identity.service';

const MAX_MESSAGE_LENGTH = 32_000; // 32KB max message content

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : ['http://localhost:3000'],
    credentials: true,
  },
})
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  private activeStreams = new Map<string, AbortController>();

  constructor(
    private chatService: ChatService,
    private conversationService: ConversationService,
    private anonRateLimit: AnonRateLimitService,
    private rateLimit: RateLimitService,
    private documentService: DocumentService,
    private identityService: IdentityService,
  ) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    data: { conversationId?: string; content: string; model?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const identity = await this.identityService.fromSocket(client);

    // --- Validate input ---
    if (!data || typeof data.content !== 'string' || !data.content.trim()) {
      client.emit('error', {
        code: 'VALIDATION',
        message: 'Message content is required.',
      });
      return;
    }

    if (data.content.length > MAX_MESSAGE_LENGTH) {
      client.emit('error', {
        code: 'VALIDATION',
        message: `Message too long. Max ${MAX_MESSAGE_LENGTH} characters.`,
      });
      return;
    }

    if (
      data.conversationId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        data.conversationId,
      )
    ) {
      client.emit('error', {
        code: 'VALIDATION',
        message: 'Invalid conversation ID format.',
      });
      return;
    }

    // --- Verify ownership of existing conversation ---
    if (data.conversationId) {
      try {
        await this.conversationService.verifyOwner(
          data.conversationId,
          identity,
        );
      } catch {
        client.emit('error', {
          code: 'FORBIDDEN',
          message: 'Access denied to this conversation.',
        });
        return;
      }
    }

    // --- Rate limiting ---
    if (identity.userId) {
      const { allowed, remaining } = this.rateLimit.check(identity.userId);
      if (!allowed) {
        client.emit('error', {
          code: 'RATE_LIMIT',
          message: 'Too many messages. Please wait a moment.',
          remaining: 0,
        });
        return;
      }
      this.rateLimit.increment(identity.userId);
    } else if (identity.anonId) {
      const { allowed, remaining } = await this.anonRateLimit.check(
        identity.anonId,
      );
      if (!allowed) {
        client.emit('error', {
          code: 'ANON_LIMIT',
          message: `Anonymous message limit reached (${this.anonRateLimit.getLimit()}). Please sign in for unlimited access.`,
          remaining: 0,
        });
        return;
      }
      await this.anonRateLimit.increment(identity.anonId);
      client.emit('usageUpdate', { remaining: remaining - 1 });
    }

    const { message: userMessage, conversationId } =
      await this.conversationService.addMessage(
        data.conversationId,
        data.content,
        'user',
        identity,
      );

    await this.documentService.linkUnlinkedToMessage(
      conversationId,
      userMessage.id,
    );

    client.emit('messageSaved', {
      message: userMessage,
      conversationId,
    });

    client.join(conversationId);

    this.server.to(conversationId).emit('streamStart', { conversationId });

    const abortController = new AbortController();
    this.activeStreams.set(conversationId, abortController);

    this.logger.log(
      `Message sent: conv=${conversationId} user=${identity.userId ?? identity.anonId}`,
    );

    const fullContent = await this.chatService.generateBotReplyStream(
      conversationId,
      data.model,
      (chunk: string) => {
        this.server
          .to(conversationId)
          .emit('streamChunk', { conversationId, chunk });
      },
      abortController.signal,
    );

    this.activeStreams.delete(conversationId);

    if (abortController.signal.aborted) {
      if (fullContent) {
        await this.conversationService.addMessage(
          conversationId,
          fullContent,
          'assistant',
          identity,
        );
      }
      this.server
        .to(conversationId)
        .emit('streamAborted', { conversationId });
      return;
    }

    const { message: botMessage } =
      await this.conversationService.addMessage(
        conversationId,
        fullContent,
        'assistant',
        identity,
      );

    this.server.to(conversationId).emit('streamEnd', {
      message: botMessage,
      conversationId,
    });
  }

  @SubscribeMessage('stopGeneration')
  async handleStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.conversationId) return;

    // Verify the requester owns this conversation
    const identity = await this.identityService.fromSocket(client);
    try {
      await this.conversationService.verifyOwner(
        data.conversationId,
        identity,
      );
    } catch {
      client.emit('error', {
        code: 'FORBIDDEN',
        message: 'Access denied to this conversation.',
      });
      return;
    }

    const controller = this.activeStreams.get(data.conversationId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(data.conversationId);
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoin(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.conversationId) return;

    // Verify the requester owns this conversation before joining the room
    const identity = await this.identityService.fromSocket(client);
    try {
      await this.conversationService.verifyOwner(
        data.conversationId,
        identity,
      );
    } catch {
      client.emit('error', {
        code: 'FORBIDDEN',
        message: 'Access denied to this conversation.',
      });
      return;
    }

    client.join(data.conversationId);
  }

  @SubscribeMessage('leaveConversation')
  handleLeave(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.conversationId) {
      client.leave(data.conversationId);
    }
  }
}
