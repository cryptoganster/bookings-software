import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * Exception thrown when attempting to remove the last role from a user.
 * A user must always have at least one role.
 * @requirements 2.4, 5.5
 */
export class CannotRemoveLastRoleException extends DomainException {
  constructor(userId: string) {
    super(`Cannot remove the last role from user ${userId}. A user must have at least one role.`);
  }
}
