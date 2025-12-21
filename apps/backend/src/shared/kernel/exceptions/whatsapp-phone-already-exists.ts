import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * Exception thrown when attempting to use a WhatsApp phone number
 * that is already registered to another entity (Business, Customer, etc.)
 */
export class WhatsAppPhoneAlreadyExistsException extends DomainException {
  constructor(whatsappPhone: string, entityType: string = 'entity') {
    super(`WhatsApp phone "${whatsappPhone}" is already registered to another ${entityType}`);
    this.name = 'WhatsAppPhoneAlreadyExistsException';
  }
}
