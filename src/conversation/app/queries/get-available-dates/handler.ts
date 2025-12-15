import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAvailableDatesQuery } from './query';
import { ICapacityReadRepository } from '@booking/domain/interfaces/repositories/capacity-read';

@QueryHandler(GetAvailableDatesQuery)
export class GetAvailableDatesHandler implements IQueryHandler<GetAvailableDatesQuery> {
  constructor(
    @Inject('ICapacityReadRepository')
    private readonly capacityReadRepository: ICapacityReadRepository,
  ) {}

  async execute(query: GetAvailableDatesQuery): Promise<Date[]> {
    // Consultar capacidades disponibles para el offering en el rango de fechas
    const capacities = await this.capacityReadRepository.findByOfferingAndDateRange(
      query.offeringId,
      query.startDate,
      query.endDate,
    );

    // Retornar solo las fechas
    return capacities.map((capacity) => capacity.date);
  }
}
