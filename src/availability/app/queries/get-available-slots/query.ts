import { IQuery } from '@nestjs/cqrs';

export class GetAvailableSlotsQuery implements IQuery {
  constructor(
    public readonly offeringId: string,
    public readonly date: Date,
  ) {}
}
