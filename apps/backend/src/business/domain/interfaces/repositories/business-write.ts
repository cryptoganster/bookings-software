import { Business } from '@business/domain/aggregates/business';

/**
 * IBusinessWriteRepository
 *
 * Write repository interface for Business aggregate
 * Following CQRS strict pattern - only write operations
 *
 * Note: For loading aggregates, use IBusinessFactory instead
 */
export interface IBusinessWriteRepository {
  /**
   * Persists a Business aggregate
   * Uses optimistic locking with version field
   * @param business Business aggregate to save
   * @throws ConcurrencyException if version conflict occurs
   */
  save(business: Business): Promise<void>;
}
