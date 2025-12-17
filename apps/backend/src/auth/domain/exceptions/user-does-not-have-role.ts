import { DomainException } from '@shared/kernel/exceptions/domain';
import { UserRole } from '../vo/user-role';

/**
 * Exception thrown when attempting to remove a role that the user doesn't have.
 * @requirements 5.5
 */
export class UserDoesNotHaveRoleException extends DomainException {
  constructor(userId: string, role: UserRole) {
    super(`User ${userId} does not have role ${role}`);
  }
}
