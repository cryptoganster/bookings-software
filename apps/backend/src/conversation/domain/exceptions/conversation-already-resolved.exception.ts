import { DomainException } from '@shared/kernel/exceptions/domain';

export class ConversationAlreadyResolvedException extends DomainException {
  constructor(conversationId: string) {
    super(`Conversation ${conversationId} is already resolved`);
  }
}
