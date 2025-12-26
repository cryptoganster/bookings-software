import { Command } from '@shared/kernel';

export class UpdateOfferingCommand extends Command<void> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
    public readonly name: string,
    public readonly durationMinutes: number,
    public readonly maxCapacityPerSlot: number,
    public readonly maxDailyCapacity: number | null,
  ) {
    super();
  }
}
