import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetAvailableTimeSlotsQuery } from './query';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CapacityModel } from '@booking/infra/persistence/models/capacity';

export interface TimeSlot {
  time: Date;
  availableSlots: number;
}

@QueryHandler(GetAvailableTimeSlotsQuery)
export class GetAvailableTimeSlotsHandler implements IQueryHandler<GetAvailableTimeSlotsQuery> {
  constructor(
    @InjectRepository(CapacityModel)
    private readonly capacityRepository: Repository<CapacityModel>,
  ) {}

  async execute(query: GetAvailableTimeSlotsQuery): Promise<TimeSlot[]> {
    // Consultar capacidad para la fecha específica
    const capacity = await this.capacityRepository.findOne({
      where: {
        offeringId: query.offeringId,
        date: query.date,
      },
    });

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
