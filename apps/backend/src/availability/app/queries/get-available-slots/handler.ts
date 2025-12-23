import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAvailableSlotsQuery } from '@availability/app/queries/get-available-slots/query';
import { IAvailabilityChecker } from '@availability/domain/interfaces/services/availability-checker.service';
import { ICapacityReadRepository } from '@availability/domain/interfaces/repositories/capacity-read';
import { TimeSlot } from '@availability/domain/read-models/capacity';

/**
 * Handler for GetAvailableSlotsQuery
 *
 * Uses AvailabilityChecker service to:
 * - Verify date is available (schedule, no blockout, has capacity)
 * - Generate time slots based on offering duration
 * - Return slots within business hours with availability count
 *
 * Requirements: 4.4, 4.5, 4.6
 */
@QueryHandler(GetAvailableSlotsQuery)
export class GetAvailableSlotsHandler implements IQueryHandler<GetAvailableSlotsQuery> {
  constructor(
    @Inject('IAvailabilityChecker')
    private readonly availabilityChecker: IAvailabilityChecker,
    @Inject('ICapacityReadRepository')
    private readonly capacityReadRepository: ICapacityReadRepository,
  ) {}

  async execute(query: GetAvailableSlotsQuery): Promise<TimeSlot[]> {
    // Use AvailabilityChecker to get available time slots (as strings)
    // This checks: schedule exists, no blockout, has capacity
    const timeSlotStrings = await this.availabilityChecker.getAvailableTimeSlots(
      query.businessId,
      query.offeringId,
      query.date,
      query.durationMinutes,
    );

    if (timeSlotStrings.length === 0) {
      return [];
    }

    // Get capacity to include availableSlots count
    const capacity = await this.capacityReadRepository.findByOfferingAndDate(
      query.offeringId,
      query.date,
    );

    if (!capacity) {
      return [];
    }

    // Transform string slots to TimeSlot objects with Date and availableSlots
    const slots: TimeSlot[] = timeSlotStrings.map((timeString) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      const slotTime = new Date(query.date);
      slotTime.setHours(hours, minutes, 0, 0);

      return {
        time: slotTime,
        availableSlots: capacity.availableSlots,
      };
    });

    return slots;
  }
}
