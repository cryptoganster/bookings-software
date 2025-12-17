import { UserRole } from '../vo/user-role';

/**
 * Domain event emitted when a role is added to a user.
 * @requirements 2.5
 */
export class UserRoleAdded {
  constructor(
    public readonly userId: string,
    public readonly role: UserRole,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
