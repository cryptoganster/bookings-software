import { DomainException } from '@shared/kernel/exceptions/domain';
import { UserRole } from '@auth/domain/vo/user-role';

/**
 * Exception thrown when attempting to add a role that the user already has.
 * @requirements 2.2, 5.4
 */
export class UserAlreadyHasRoleException extends DomainException {
  constructor(userId: string, role: UserRole) {
    super(`User ${userId} already has role ${role}`);
  }
}
