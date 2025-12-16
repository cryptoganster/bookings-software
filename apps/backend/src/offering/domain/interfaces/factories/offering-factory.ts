import { Offering } from '@offering/domain/aggregates/offering';

/**
 * Factory for loading Offering aggregates from persistence
 *
 * Purpose: Separate read operations from write repository to maintain CQRS strict compliance.
 *
 * Use this factory when:
 * - You need to load an Offering aggregate to modify it (in command handlers)
 * - You need the aggregate with its business logic
 * - You need the aggregate with its version for optimistic locking
 *
 * Do NOT use this factory when:
 * - You only need to display data (use IOfferingReadRepository instead)
 * - You're in a query handler (use read repository)
 */
export interface IOfferingFactory {
  /**
   * Loads an Offering aggregate by its ID for modification
   * @param id - The offering ID
   * @returns The Offering aggregate with business logic, or null if not found
   */
  loadById(id: string): Promise<Offering | null>;

  /**
   * Loads an Offering aggregate by business ID and name for validation
   * @param businessId - The business ID
   * @param name - The offering name
   * @returns The Offering aggregate with business logic, or null if not found
   */
  loadByBusinessIdAndName(businessId: string, name: string): Promise<Offering | null>;
}
