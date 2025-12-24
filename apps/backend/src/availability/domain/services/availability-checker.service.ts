import { Injectable, Inject } from '@nestjs/common';
import { IAvailabilityChecker } from '@availability/domain/interfaces/services/availability-checker.service';
import { IScheduleReadRepository } from '@availability/domain/interfaces/repositories/schedule-read';
import { IBlockoutReadRepository } from '@availability/domain/interfaces/repositories/blockout-read';
import { ICapacityFactory } from '@availability/domain/interfaces/factories/capacity-factory';

/**
 * Domain Service: AvailabilityChecker
 *
 * This domain service coordinates between Schedule, Blockout, and Capacity
 * to determine availability for bookings.
 *
 * Domain Services contain business logic that doesn't naturally fit within
 * a single aggregate. They depend on repository interfaces (abstractions),
 * not concrete implementations, which keeps them in the domain layer.
 */
@Injectable()
export class AvailabilityChecker implements IAvailabilityChecker {
  constructor(
    @Inject('IScheduleReadRepository')
    private readonly scheduleReadRepo: IScheduleReadRepository,
    @Inject('IBlockoutReadRepository')
    private readonly blockoutReadRepo: IBlockoutReadRepository,
    @Inject('ICapacityFactory')
    private readonly capacityFactory: ICapacityFactory,
  ) {}

  /**
   * Checks if a specific date is available for booking
   *
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  async isDateAvailable(businessId: string, offeringId: string, date: Date): Promise<boolean> {
    // Normalize date to midnight UTC for comparison
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // 1. Check if date falls within business hours (Requirement 4.1)
    const dayOfWeek = normalizedDate.getUTCDay(); // 0-6 (Sunday-Saturday) in UTC
    const schedule = await this.scheduleReadRepo.findByBusinessAndDay(businessId, dayOfWeek);

    if (!schedule || !schedule.isActive) {
      return false; // No business hours for this day
    }

    // 2. Check if date is blocked (Requirement 4.2)
    const blockouts = await this.blockoutReadRepo.findByBusinessAndDateRange(
      businessId,
      normalizedDate,
      normalizedDate,
    );

    if (blockouts.length > 0) {
      return false; // Date is blocked
    }

    // 3. Check if there's available capacity (Requirement 4.3)
    const capacity = await this.capacityFactory.loadByOfferingAndDate(offeringId, normalizedDate);

    if (!capacity || !capacity.hasAvailableSlots()) {
      return false; // No capacity or fully booked
    }

    return true;
  }

  /**
   * Gets available time slots for a specific date
   *
   * Validates: Requirements 4.4, 4.5, 4.6
   */
  async getAvailableTimeSlots(
    businessId: string,
    offeringId: string,
    date: Date,
    duration: number,
  ): Promise<string[]> {
    // Normalize date to midnight UTC
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // 1. Check if date is blocked (Requirement 4.6)
    const blockouts = await this.blockoutReadRepo.findByBusinessAndDateRange(
      businessId,
      normalizedDate,
      normalizedDate,
    );

    if (blockouts.length > 0) {
      return []; // Date is blocked, no slots available
    }

    // 2. Get business hours for this day (Requirement 4.5)
    const dayOfWeek = normalizedDate.getUTCDay(); // 0-6 (Sunday-Saturday) in UTC
    const schedule = await this.scheduleReadRepo.findByBusinessAndDay(businessId, dayOfWeek);

    if (!schedule || !schedule.isActive) {
      return []; // No business hours for this day
    }

    // 3. Check capacity
    const capacity = await this.capacityFactory.loadByOfferingAndDate(offeringId, normalizedDate);

    if (!capacity || !capacity.hasAvailableSlots()) {
      return []; // No capacity available
    }

    // 4. Generate time slots based on offering duration (Requirement 4.4)
    const slots = this.generateTimeSlots(schedule.startTime, schedule.endTime, duration);

    return slots;
  }

  /**
   * Generates time slots between start and end time based on duration
   *
   * @param startTime - Start time in HH:mm format (e.g., "09:00")
   * @param endTime - End time in HH:mm format (e.g., "17:00")
   * @param duration - Duration in minutes (e.g., 30)
   * @returns Array of time slots in HH:mm format
   *
   * Example: generateTimeSlots("09:00", "11:00", 30) => ["09:00", "09:30", "10:00", "10:30"]
   */
  private generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
    const slots: string[] = [];

    // Parse start time
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let currentMinutes = startHour * 60 + startMinute;

    // Parse end time
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const endMinutes = endHour * 60 + endMinute;

    // Generate slots
    while (currentMinutes + duration <= endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;

      // Format as HH:mm
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeSlot);

      currentMinutes += duration;
    }

    return slots;
  }
}
