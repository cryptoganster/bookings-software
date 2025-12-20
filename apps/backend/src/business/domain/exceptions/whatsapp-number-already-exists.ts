import { DomainException } from '@shared/kernel/exceptions/domain';

export class WhatsAppNumberAlreadyExistsException extends DomainException {
  constructor(whatsappNumber: string) {
    super(`WhatsApp number "${whatsappNumber}" is already registered to another business`);
    this.name = 'WhatsAppNumberAlreadyExistsException';
  }
}
