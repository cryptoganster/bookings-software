export class GetAvailableDatesQuery {
  constructor(
    public readonly businessId: string,
    public readonly offeringId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {}
}
