import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAvailableSlotsQuery } from '@availability/app/queries/get-available-slots/query';
import { ICapacityReadRepository } from '@availability/domain/interfaces/repositories/capacity-read';
import { TimeSlot } from '@availability/domain/read-models/capacity';

@QueryHandler(GetAvailableSlotsQuery)
export class GetAvailableSlotsHandler implements IQueryHandler<GetAvailableSlotsQuery> {
  constructor(
    @Inject('ICapacityReadRepository')
    private readonly capacityReadRepository: ICapacityReadRepository,
  ) {}

  async execute(query: GetAvailableSlotsQuery): Promise<TimeSlot[]> {
    // Consultar capacidad para la fecha específica
    const capacity = await this.capacityReadRepository.findByOfferingAndDate(
      query.offeringId,
      query.date,
    );

    if (!capacity || capacity.availableSlots <= 0) {
      return [];
    }

    // Generar slots de tiempo disponibles
    // Por ahora, generamos slots cada 1.5 horas desde las 9 AM hasta las 6 PM
    const slots: TimeSlot[] = [];
    const baseDate = new Date(query.date);

    const startHour = 9;
    const endHour = 18;
    const intervalMinutes = 90;

    for (let hour = startHour; hour < endHour; hour += intervalMinutes / 60) {
      const slotTime = new Date(baseDate);
      slotTime.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);

      slots.push({
        time: slotTime,
        availableSlots: capacity.availableSlots,
      });
    }

    return slots;
  }
}
