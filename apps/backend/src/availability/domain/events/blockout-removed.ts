export class BlockoutRemoved {
  constructor(
    public readonly blockoutId: string,
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
