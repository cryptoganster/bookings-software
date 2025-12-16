import { DomainException } from './domain';

export class ConcurrencyException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
