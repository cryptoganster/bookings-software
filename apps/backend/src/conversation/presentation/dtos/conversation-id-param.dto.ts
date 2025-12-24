import { IsUUID } from 'class-validator';

/**
 * DTO for conversation ID parameter validation
 */
export class ConversationIdParamDto {
  @IsUUID()
  id!: string;
}
