import { DomainException } from '@shared/kernel/exceptions/domain';

export class InvalidBusinessAddressException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBusinessAddressException';
  }
}
