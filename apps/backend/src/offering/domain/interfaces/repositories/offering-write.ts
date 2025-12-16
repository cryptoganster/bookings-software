import { Offering } from '@offering/domain/aggregates/offering';

/**
 * Write Repository for Offering aggregate
 *
 * CQRS Strict Compliance:
 * - This repository ONLY handles write operations (save, delete)
 * - For loading aggregates to modify, use IOfferingFactory
 * - For read operations (queries), use IOfferingReadRepository
 *
 * Pattern:
 * 1. Command Handler loads aggregate via IOfferingFactory
 * 2. Command Handler modifies aggregate (business logic)
 * 3. Command Handler persists via IOfferingWriteRepository.save()
 */
export interface IOfferingWriteRepository {
  /**
   * Persists an offering aggregate
   * Uses optimistic locking with version field
   */
  save(offering: Offering): Promise<void>;
}
