export class BlockoutCreated {
  constructor(
    public readonly blockoutId: string,
    public readonly businessId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly reason: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
