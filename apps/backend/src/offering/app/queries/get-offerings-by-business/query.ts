import { Query } from '@shared/kernel';
import { OfferingReadModel } from '@offering/domain/read-models/offering';

/**
 * Query para obtener todos los offerings de un negocio
 * Incluye activos e inactivos, ordenados alfabéticamente
 */
export class GetOfferingsByBusinessQuery extends Query<OfferingReadModel[]> {
  constructor(public readonly businessId: string) {
    super();
  }
}
