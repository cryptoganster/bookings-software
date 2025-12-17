import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetActiveOfferingsQuery } from './query';
import { OfferingReadModel } from '../../../domain/read-models/offering';
import { IOfferingReadRepository } from '../../../domain/interfaces/repositories/offering-read';

/**
 * Handler para obtener offerings activos de un negocio
 * Usa read repository para queries optimizadas
 */
@QueryHandler(GetActiveOfferingsQuery)
export class GetActiveOfferingsHandler implements IQueryHandler<GetActiveOfferingsQuery> {
  constructor(
    @Inject('IOfferingReadRepository')
    private readonly readRepository: IOfferingReadRepository,
  ) {}

  async execute(query: GetActiveOfferingsQuery): Promise<OfferingReadModel[]> {
    return this.readRepository.findActiveByBusinessId(query.businessId);
  }
}
