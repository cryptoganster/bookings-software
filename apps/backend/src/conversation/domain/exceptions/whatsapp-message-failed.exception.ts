import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * Exception lanzada cuando falla el envío de un mensaje de WhatsApp
 */
export class WhatsAppMessageFailedException extends DomainException {
  constructor(
    public readonly conversationId: string,
    public readonly reason: string,
  ) {
    super(`Failed to send WhatsApp message for conversation ${conversationId}: ${reason}`);
  }
}
