import { DomainException } from '@shared/kernel/exceptions/domain';

export class InvalidConversationStatusException extends DomainException {
  constructor(conversationId: string, currentStatus: string, expectedStatus: string) {
    super(
      `Cannot resolve conversation ${conversationId}. Current status is '${currentStatus}', expected '${expectedStatus}'`,
    );
  }
}
