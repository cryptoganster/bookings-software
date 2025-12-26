import { Command } from '@shared/kernel';

/**
 * Command to set or update capacity for a specific offering and date
 *
 * This command creates new capacity if it doesn't exist, or updates existing capacity
 */
export class SetCapacityCommand extends Command<{ capacityId: string }> {
  constructor(
    public readonly offeringId: string,
    public readonly date: Date,
    public readonly totalSlots: number,
  ) {
    super();
  }
}
