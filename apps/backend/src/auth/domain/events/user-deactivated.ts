/**
 * Domain event emitted when a user is deactivated.
 * @requirements 7.5
 */
export class UserDeactivated {
  constructor(
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
