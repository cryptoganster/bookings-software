import { UserRole } from '../vo/user-role';

/**
 * Domain event emitted when a new user is registered.
 * @requirements 3.1, 3.4
 * @property 7
 */
export class UserRegistered {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly initialRole: UserRole = UserRole.BUSINESS_OWNER,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
