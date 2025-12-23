export class ScheduleUpdated {
  constructor(
    public readonly scheduleId: string,
    public readonly businessId: string,
    public readonly dayOfWeek: number,
    public readonly startTime: string,
    public readonly endTime: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
