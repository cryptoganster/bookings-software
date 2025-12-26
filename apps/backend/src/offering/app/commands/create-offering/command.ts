import { Command } from '@shared/kernel';

export class CreateOfferingCommand extends Command<{ offeringId: string }> {
  constructor(
    public readonly businessId: string,
    public readonly name: string,
    public readonly durationMinutes: number,
    public readonly maxCapacityPerSlot: number,
    public readonly maxDailyCapacity: number | null,
  ) {
    super();
  }
}
