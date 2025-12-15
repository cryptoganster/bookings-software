export class SlotReleased {
  constructor(
    public readonly capacityId: string,
    public readonly offeringId: string,
    public readonly date: Date,
    public readonly availableSlots: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
