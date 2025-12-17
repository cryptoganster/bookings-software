/**
 * Domain event emitted when a user's email is verified.
 * @requirements 6.4
 */
export class UserEmailVerified {
  constructor(
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
