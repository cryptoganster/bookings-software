import { Business } from '@business/domain/aggregates/business';

/**
 * IBusinessFactory
 *
 * Factory interface for loading Business aggregates from persistence
 * Used in Command Handlers to load aggregates for modification
 *
 * Following CQRS strict pattern:
 * - Factory loads aggregates WITH business logic
 * - Used for write operations (commands)
 * - Preserves version for optimistic locking
 */
export interface IBusinessFactory {
  /**
   * Loads a Business aggregate by ID
   * @param id Business ID
   * @returns Business aggregate with business logic, or null if not found
   */
  loadById(id: string): Promise<Business | null>;
}
