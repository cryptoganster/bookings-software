import { UserRole } from '../vo/user-role';

/**
 * Domain event emitted when a role is removed from a user.
 * @requirements 2.5
 */
export class UserRoleRemoved {
  constructor(
    public readonly userId: string,
    public readonly role: UserRole,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
