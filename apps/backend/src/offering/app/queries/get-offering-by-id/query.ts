import { Query } from '@shared/kernel';
import { OfferingReadModel } from '@offering/domain/read-models/offering';

/**
 * Query para obtener un offering específico por ID
 * Opcionalmente valida que pertenezca a un negocio específico
 */
export class GetOfferingByIdQuery extends Query<OfferingReadModel | null> {
  constructor(
    public readonly offeringId: string,
    public readonly businessId?: string,
  ) {
    super();
  }
}
