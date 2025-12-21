import { BusinessOwner } from '@account/domain/aggregates/business-owner';

/**
 * IBusinessOwnerFactory
 * Factory para cargar BusinessOwner aggregates desde persistencia (CQRS strict)
 * Usado en Command Handlers para modificar aggregates
 */
export interface IBusinessOwnerFactory {
  /**
   * Carga un BusinessOwner por su ID
   * Retorna el aggregate con lógica de negocio y versión preservada
   */
  loadById(id: string): Promise<BusinessOwner | null>;

  /**
   * Carga un BusinessOwner por el userId vinculado
   * Retorna el aggregate con lógica de negocio y versión preservada
   */
  loadByUserId(userId: string): Promise<BusinessOwner | null>;
}
