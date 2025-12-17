import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetOfferingByIdQuery } from './query';
import { OfferingReadModel } from '../../../domain/read-models/offering';
import { IOfferingReadRepository } from '../../../domain/interfaces/repositories/offering-read';

/**
 * Handler para obtener un offering por ID
 * Valida businessId si se proporciona (multi-tenancy)
 */
@QueryHandler(GetOfferingByIdQuery)
export class GetOfferingByIdHandler implements IQueryHandler<GetOfferingByIdQuery> {
  constructor(
    @Inject('IOfferingReadRepository')
    private readonly readRepository: IOfferingReadRepository,
  ) {}

  async execute(query: GetOfferingByIdQuery): Promise<OfferingReadModel | null> {
    const offering = await this.readRepository.findById(query.offeringId);

    // Si no existe, retornar null
    if (!offering) {
      return null;
    }

    // Si se proporciona businessId, validar que coincida (multi-tenancy)
    if (query.businessId && offering.businessId !== query.businessId) {
      return null;
    }

    return offering;
  }
}
