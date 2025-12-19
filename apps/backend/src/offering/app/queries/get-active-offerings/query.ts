import { Query } from '@nestjs/cqrs';
import { OfferingReadModel } from '@offering/domain/read-models/offering';

/**
 * Query para obtener todos los offerings activos de un negocio
 * Retorna lista ordenada alfabéticamente por nombre
 */
export class GetActiveOfferingsQuery extends Query<OfferingReadModel[]> {
  constructor(public readonly businessId: string) {
    super();
  }
}
