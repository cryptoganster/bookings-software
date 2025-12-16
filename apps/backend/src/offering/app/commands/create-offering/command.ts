import { ICommand } from '@nestjs/cqrs';

export class CreateOfferingCommand implements ICommand {
  constructor(
    public readonly businessId: string,
    public readonly name: string,
    public readonly durationMinutes: number,
    public readonly maxCapacityPerSlot: number,
    public readonly maxDailyCapacity: number | null,
  ) {}
}
