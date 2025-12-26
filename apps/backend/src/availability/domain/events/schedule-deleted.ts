export class ScheduleDeleted {
  constructor(
    public readonly scheduleId: string,
    public readonly businessId: string,
    public readonly dayOfWeek: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
