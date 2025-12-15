export class UserRegistered {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
