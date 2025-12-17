import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * Exception thrown when attempting to verify an email that is already verified.
 * @requirements 6.5
 */
export class EmailAlreadyVerifiedException extends DomainException {
  constructor(userId: string) {
    super(`Email for user ${userId} is already verified`);
  }
}
