import { DomainException } from '@shared/kernel/exceptions/domain';

export class InvalidBusinessNameException extends DomainException {
  constructor(name: string) {
    super(`Invalid business name: "${name}". Name must be between 3 and 100 characters`);
    this.name = 'InvalidBusinessNameException';
  }
}
