export class OfferingUpdated {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
    public readonly name: string,
    public readonly durationMinutes: number,
    public readonly maxCapacityPerSlot: number,
    public readonly maxDailyCapacity: number | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
