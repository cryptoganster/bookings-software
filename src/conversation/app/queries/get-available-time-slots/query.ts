export class GetAvailableTimeSlotsQuery {
  constructor(
    public readonly businessId: string,
    public readonly offeringId: string,
    public readonly date: Date,
  ) {}
}
