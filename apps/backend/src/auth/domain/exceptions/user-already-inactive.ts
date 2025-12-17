import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * Exception thrown when attempting to deactivate a user that is already inactive.
 * @requirements 7.5
 */
export class UserAlreadyInactiveException extends DomainException {
  constructor(userId: string) {
    super(`User ${userId} is already inactive`);
  }
}
