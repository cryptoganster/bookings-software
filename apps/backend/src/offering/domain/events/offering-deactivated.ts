export class OfferingDeactivated {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
