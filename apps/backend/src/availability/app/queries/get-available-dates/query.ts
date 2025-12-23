import { Query } from '@nestjs/cqrs';

/**
 * Query to get available dates
 * TODO: Implement full query logic and return type
 */
export class GetAvailableDatesQuery extends Query<Date[]> {
  constructor(
    public readonly offeringId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {
    super();
  }
}
