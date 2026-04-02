import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ChatService } from './chat.service';
import { ConversationService } from './conversation.service';
import { AnonRateLimitService } from './anon-rate-limit.service';
import { AnonRateLimitGuard } from './anon-rate-limit.guard';
import { DocumentService } from './document.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { IdentityGuard } from '../auth/identity.guard';
import { IdentityService } from '../common/identity.service';

@UseGuards(IdentityGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private conversationService: ConversationService,
    private anonRateLimit: AnonRateLimitService,
    private documentService: DocumentService,
    private identityService: IdentityService,
  ) {}

  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.conversationService.getAll(
      this.identityService.fromRequest(req),
    );
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @Req() req: any) {
    return this.conversationService.getById(
      id,
      this.identityService.fromRequest(req),
    );
  }

  @UseGuards(AnonRateLimitGuard)
  @Post('conversations')
  createConversation(@Body() dto: CreateConversationDto, @Req() req: any) {
    return this.conversationService.create(
      dto,
      this.identityService.fromRequest(req),
    );
  }

  @Delete('conversations/:id')
  deleteConversation(@Param('id') id: string, @Req() req: any) {
    return this.conversationService.delete(
      id,
      this.identityService.fromRequest(req),
    );
  }

  @Patch('conversations/:id/title')
  updateTitle(
    @Param('id') id: string,
    @Body('title') title: string,
    @Req() req: any,
  ) {
    return this.conversationService.updateTitle(
      id,
      title,
      this.identityService.fromRequest(req),
    );
  }

  // --- Documents ---

  @UseGuards(AnonRateLimitGuard)
  @Post('conversations/:id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }
    return this.documentService.upload(
      file,
      id,
      this.identityService.fromRequest(req),
    );
  }

  @Get('conversations/:id/documents')
  getDocuments(@Param('id') id: string, @Req() req: any) {
    return this.documentService.getByConversation(
      id,
      this.identityService.fromRequest(req),
    );
  }

  @Get('documents/:docId/url')
  async getFileUrl(@Param('docId') docId: string, @Req() req: any) {
    const url = await this.documentService.getFileUrl(
      docId,
      this.identityService.fromRequest(req),
    );
    if (!url) throw new NotFoundException();
    return { url };
  }

  @Delete('documents/:docId')
  deleteDocument(@Param('docId') docId: string, @Req() req: any) {
    return this.documentService.deleteDocument(
      docId,
      this.identityService.fromRequest(req),
    );
  }

  @Get('settings/model')
  getDefaultModel() {
    return {
      model: this.chatService.getDefaultModel(),
      allowed: this.chatService.getAllowedModels(),
    };
  }

  @Get('usage')
  async getUsage(@Req() req: any) {
    const { userId, anonId } = this.identityService.fromRequest(req);
    if (userId) {
      return {
        authenticated: true,
        remaining: null,
        limit: null,
        resetsAt: null,
      };
    }
    const { remaining, resetsAt } = await this.anonRateLimit.check(anonId!);
    return {
      authenticated: false,
      remaining,
      limit: this.anonRateLimit.getLimit(),
      resetsAt,
    };
  }
}
