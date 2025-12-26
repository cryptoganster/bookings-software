import { Command } from '@shared/kernel';

/**
 * Command to delete a schedule
 * TODO: Implement full command logic
 */
export class DeleteScheduleCommand extends Command<void> {
  constructor(public readonly scheduleId: string) {
    super();
  }
}
