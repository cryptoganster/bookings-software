import { DomainException } from '@shared/kernel/exceptions/domain';

export class ConcurrencyException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
