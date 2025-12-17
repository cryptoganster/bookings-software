/**
 * Domain event emitted when a user is activated.
 * @requirements 7.4
 */
export class UserActivated {
  constructor(
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
