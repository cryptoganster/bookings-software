import { Query } from '@shared/kernel';

/**
 * Query to get available dates for an offering within a date range
 *
 * Returns dates that:
 * - Have an active schedule for that day of week
 * - Are not blocked by a blockout
 * - Have available capacity
 */
export class GetAvailableDatesQuery extends Query<Date[]> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {
    super();
  }
}
