import { Command } from '@nestjs/cqrs';

/**
 * Command to update a schedule
 * TODO: Implement full command logic
 */
export class UpdateScheduleCommand extends Command<void> {
  constructor(
    public readonly scheduleId: string,
    public readonly startTime?: string,
    public readonly endTime?: string,
  ) {
    super();
  }
}
