import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAvailableDatesQuery } from '@availability/app/queries/get-available-dates/query';
import { IAvailabilityChecker } from '@availability/domain/interfaces/services/availability-checker.service';

/**
 * Handler for GetAvailableDatesQuery
 *
 * Uses AvailabilityChecker service to filter dates by:
 * - Active schedules for the day of week
 * - No blockouts on the date
 * - Available capacity for the offering
 *
 * Requirements: 4.1, 4.2, 4.3
 */
@QueryHandler(GetAvailableDatesQuery)
export class GetAvailableDatesHandler implements IQueryHandler<GetAvailableDatesQuery> {
  constructor(
    @Inject('IAvailabilityChecker')
    private readonly availabilityChecker: IAvailabilityChecker,
  ) {}

  async execute(query: GetAvailableDatesQuery): Promise<Date[]> {
    const availableDates: Date[] = [];

    // Iterate through each date in the range
    // Use UTC to avoid timezone issues
    const currentDate = new Date(query.startDate);
    currentDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(query.endDate);
    endDate.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      // Check if date is available using AvailabilityChecker
      const isAvailable = await this.availabilityChecker.isDateAvailable(
        query.businessId,
        query.offeringId,
        new Date(currentDate),
      );

      if (isAvailable) {
        availableDates.push(new Date(currentDate));
      }

      // Move to next day (using UTC to avoid DST issues)
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return availableDates;
  }
}
