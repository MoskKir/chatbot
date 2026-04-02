import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ConversationService } from './conversation.service';
import { AnonRateLimitService } from './anon-rate-limit.service';
import { AnonRateLimitGuard } from './anon-rate-limit.guard';
import { RateLimitService } from './rate-limit.service';
import { DocumentService } from './document.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { LLM_PROVIDER } from './llm/llm-provider.interface';
import { OpenRouterProvider } from './llm/openrouter.provider';
import { TEXT_EXTRACTORS } from './extractors/text-extractor.interface';
import { PdfExtractor } from './extractors/pdf.extractor';
import { DocxExtractor } from './extractors/docx.extractor';
import { PlainTextExtractor } from './extractors/plaintext.extractor';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    ConversationService,
    AnonRateLimitService,
    AnonRateLimitGuard,
    RateLimitService,
    DocumentService,
    ChatGateway,
    {
      provide: LLM_PROVIDER,
      useClass: OpenRouterProvider,
    },
    PdfExtractor,
    DocxExtractor,
    PlainTextExtractor,
    {
      provide: TEXT_EXTRACTORS,
      useFactory: (
        pdf: PdfExtractor,
        docx: DocxExtractor,
        plaintext: PlainTextExtractor,
      ) => [pdf, docx, plaintext],
      inject: [PdfExtractor, DocxExtractor, PlainTextExtractor],
    },
  ],
})
export class ChatModule {}
