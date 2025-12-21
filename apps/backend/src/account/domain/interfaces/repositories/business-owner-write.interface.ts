import { BusinessOwner } from '@account/domain/aggregates/business-owner';

/**
 * IBusinessOwnerWriteRepository
 * Repository para operaciones de escritura (CQRS strict)
 * Solo contiene método save() - NO findById (usar Factory)
 */
export interface IBusinessOwnerWriteRepository {
  /**
   * Persiste un BusinessOwner aggregate
   * Usa Optimistic Locking verificando la versión
   * @throws ConcurrencyException si la versión no coincide
   */
  save(businessOwner: BusinessOwner): Promise<void>;
}
