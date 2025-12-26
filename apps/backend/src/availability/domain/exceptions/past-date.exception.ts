import { DomainException } from '@shared/kernel/exceptions/domain';

export class PastDateException extends DomainException {
  constructor(date: Date) {
    super(`Cannot create blockout for past date: ${date.toISOString()}`);
  }
}
