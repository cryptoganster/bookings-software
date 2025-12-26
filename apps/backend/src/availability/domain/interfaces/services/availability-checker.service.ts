/**
 * Domain Service Interface: AvailabilityChecker
 *
 * This service encapsulates complex business logic that doesn't naturally fit
 * within a single aggregate. It coordinates between Schedule, Blockout, and Capacity
 * to determine availability.
 *
 * Located in domain/interfaces because it's a domain concept, but the implementation
 * will be in infrastructure since it depends on repositories.
 */
export interface IAvailabilityChecker {
  /**
   * Checks if a specific date is available for booking
   *
   * A date is available if:
   * - It falls within business hours (has an active schedule for that day of week)
   * - It is not blocked by any blockout
   * - It has available capacity for the offering
   *
   * @param businessId - The business to check availability for
   * @param offeringId - The offering/service to check
   * @param date - The date to check
   * @returns true if the date is available, false otherwise
   *
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  isDateAvailable(businessId: string, offeringId: string, date: Date): Promise<boolean>;

  /**
   * Gets available time slots for a specific date
   *
   * Returns an array of time slots (in HH:mm format) that are available for booking.
   * Slots are generated based on:
   * - Business hours for that day of week
   * - Offering duration (slots are spaced by duration)
   * - Available capacity (only slots with capacity > 0)
   * - Not blocked by blockouts
   *
   * @param businessId - The business to get slots for
   * @param offeringId - The offering/service to get slots for
   * @param date - The date to get slots for
   * @param duration - Duration of the offering in minutes
   * @returns Array of available time slots in HH:mm format (e.g., ["09:00", "09:30", "10:00"])
   *
   * Validates: Requirements 4.4, 4.5, 4.6
   */
  getAvailableTimeSlots(
    businessId: string,
    offeringId: string,
    date: Date,
    duration: number,
  ): Promise<string[]>;
}
