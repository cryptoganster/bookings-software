import { BusinessOwnerReadModel } from '@account/domain/read_models/business-owner.read-model';

/**
 * IBusinessOwnerReadRepository
 * Repository para operaciones de lectura (CQRS strict)
 * Retorna Read Models (DTOs) optimizados para queries
 */
export interface IBusinessOwnerReadRepository {
  /**
   * Busca un BusinessOwner por su ID
   * Retorna Read Model (DTO) sin lógica de negocio
   */
  findById(id: string): Promise<BusinessOwnerReadModel | null>;

  /**
   * Busca un BusinessOwner por el userId vinculado
   * Retorna Read Model (DTO) sin lógica de negocio
   */
  findByUserId(userId: string): Promise<BusinessOwnerReadModel | null>;
}
