import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetOfferingsByBusinessQuery } from './query';
import { OfferingReadModel } from '../../../domain/read-models/offering';
import { IOfferingReadRepository } from '../../../domain/interfaces/repositories/offering-read';

/**
 * Handler para obtener todos los offerings de un negocio
 * Retorna activos e inactivos, ordenados alfabéticamente
 */
@QueryHandler(GetOfferingsByBusinessQuery)
export class GetOfferingsByBusinessHandler
  implements IQueryHandler<GetOfferingsByBusinessQuery>
{
  constructor(
    @Inject('IOfferingReadRepository')
    private readonly readRepository: IOfferingReadRepository,
  ) {}

  async execute(
    query: GetOfferingsByBusinessQuery,
  ): Promise<OfferingReadModel[]> {
    return this.readRepository.findByBusinessId(query.businessId);
  }
}
