import { Command } from '@nestjs/cqrs';

/**
 * Command to create a schedule
 * TODO: Implement full command logic
 */
export class CreateScheduleCommand extends Command<{ scheduleId: string }> {
  constructor(
    public readonly businessId: string,
    public readonly dayOfWeek: number,
    public readonly startTime: string,
    public readonly endTime: string,
  ) {
    super();
  }
}
