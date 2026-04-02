import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
