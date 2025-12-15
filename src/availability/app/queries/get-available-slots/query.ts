import { IQuery } from '@nestjs/cqrs';
import { TimeSlot } from '@availability/domain/read-models/capacity';

export class GetAvailableSlotsQuery implements IQuery {
  constructor(
    public readonly offeringId: string,
    public readonly date: Date,
  ) {}
}
