import { DomainException } from '@shared/kernel/exceptions/domain';

export class InvalidWhatsAppNumberException extends DomainException {
  constructor(value: string) {
    super(`Invalid WhatsApp number: "${value}". Must be in E.164 format (e.g., +18095551234)`);
    this.name = 'InvalidWhatsAppNumberException';
  }
}
