import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAvailableDatesQuery } from './query';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CapacityModel } from '@booking/infra/persistence/models/capacity';

@QueryHandler(GetAvailableDatesQuery)
export class GetAvailableDatesHandler implements IQueryHandler<GetAvailableDatesQuery> {
  constructor(
    @InjectRepository(CapacityModel)
    private readonly capacityRepository: Repository<CapacityModel>,
  ) {}

  async execute(query: GetAvailableDatesQuery): Promise<Date[]> {
    // Consultar capacidades disponibles para el offering en el rango de fechas
    const capacities = await this.capacityRepository
      .createQueryBuilder('capacity')
      .where('capacity.offeringId = :offeringId', { offeringId: query.offeringId })
      .andWhere('capacity.date >= :startDate', { startDate: query.startDate })
      .andWhere('capacity.date <= :endDate', { endDate: query.endDate })
      .andWhere('capacity.availableSlots > 0')
      .orderBy('capacity.date', 'ASC')
      .getMany();

    // Retornar solo las fechas
    return capacities.map((capacity) => capacity.date);
  }
}
