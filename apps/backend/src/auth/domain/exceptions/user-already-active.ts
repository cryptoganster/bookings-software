import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * Exception thrown when attempting to activate a user that is already active.
 * @requirements 7.3
 */
export class UserAlreadyActiveException extends DomainException {
  constructor(userId: string) {
    super(`User ${userId} is already active`);
  }
}
