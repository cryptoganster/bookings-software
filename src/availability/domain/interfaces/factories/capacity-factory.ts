import { Capacity } from '../../aggregates/capacity';

/**
 * Factory interface for loading Capacity aggregates from persistence
 * 
 * Responsibilities:
 * - Load domain aggregates (with business logic) from database
 * - Reconstruct aggregate state for modification
 * 
 * This is separate from:
 * - ICapacityReadRepository: Returns read models (DTOs) for queries
 * - ICapacityWriteRepository: Only persists aggregates
 */
export interface ICapacityFactory {
  /**
   * Loads a Capacity aggregate by offering and date for modification
   * 
   * @returns Domain aggregate with business logic (not a read model)
   * @usage Used in command handlers to load aggregates before modification
   * @example
   * const capacity = await factory.loadByOfferingAndDate(offeringId, date);
   * capacity.bookSlot(); // Business logic
   * await writeRepo.save(capacity); // Persist
   */
  loadByOfferingAndDate(offeringId: string, date: Date): Promise<Capacity | null>;
  
  /**
   * Loads a Capacity aggregate by ID for modification
   * 
   * @returns Domain aggregate with business logic
   */
  loadById(id: string): Promise<Capacity | null>;
}
