import { DomainException } from '@shared/kernel/exceptions/domain';

export class BusinessNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`Business not found: ${identifier}`);
    this.name = 'BusinessNotFoundException';
  }
}
