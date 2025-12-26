import { Command } from '@shared/kernel';

/**
 * Command: CreateSchedule
 *
 * Creates a new schedule for a business defining operating hours for a specific day.
 *
 * Requirements: 1.1, 1.2, 1.3
 */
export class CreateScheduleCommand extends Command<{ scheduleId: string }> {
  constructor(
    public readonly businessId: string,
    public readonly dayOfWeek: number, // 0-6 (Sunday-Saturday)
    public readonly startTime: string, // HH:mm format
    public readonly endTime: string, // HH:mm format
  ) {
    super();
  }
}
