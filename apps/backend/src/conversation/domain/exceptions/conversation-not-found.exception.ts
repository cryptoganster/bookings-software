import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * ConversationNotFoundException
 *
 * Thrown when a conversation is not found by ID.
 */
export class ConversationNotFoundException extends DomainException {
  constructor(conversationId: string) {
    super(`Conversation with id ${conversationId} not found`);
  }
}
