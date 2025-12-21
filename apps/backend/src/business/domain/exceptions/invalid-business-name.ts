import { DomainException } from '@shared/kernel/exceptions/domain';

export class InvalidBusinessNameException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBusinessNameException';
  }
}
