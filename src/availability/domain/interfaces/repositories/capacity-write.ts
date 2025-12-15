import { Capacity } from '../../aggregates/capacity';

/**
 * Write Repository for Capacity Aggregate
 *
 * Responsibility: ONLY persist aggregates (no loading)
 *
 * In clean CQRS/DDD:
 * - ICapacityFactory: Loads aggregates for modification
 * - ICapacityWriteRepository: Persists aggregates
 * - ICapacityReadRepository: Returns read models for queries
 *
 * This separation keeps responsibilities clear and testable.
 */
export interface ICapacityWriteRepository {
  /**
   * Persists a Capacity aggregate with optimistic locking
   *
   * @param capacity The aggregate to persist
   * @throws ConcurrencyException if version conflict occurs
   * @usage Called after modifying an aggregate to persist changes
   * @example
   * const capacity = await factory.loadByOfferingAndDate(offeringId, date);
   * capacity.bookSlot(); // Business logic
   * await writeRepo.save(capacity); // Persist with optimistic locking
   */
  save(capacity: Capacity): Promise<void>;
}
