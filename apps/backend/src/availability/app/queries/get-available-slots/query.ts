import { Query } from '@shared/kernel';
import { TimeSlot } from '@availability/domain/read-models/capacity';

/**
 * Query to get available time slots for an offering on a specific date
 *
 * Returns time slots that:
 * - Fall within business hours (schedule)
 * - Are not blocked
 * - Have available capacity
 * - Match the offering duration
 */
export class GetAvailableSlotsQuery extends Query<TimeSlot[]> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId: string,
    public readonly date: Date,
    public readonly durationMinutes: number,
  ) {
    super();
  }
}
