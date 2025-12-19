import { User } from '@auth/domain/aggregates/user';

/**
 * Factory for loading User aggregates for modification.
 *
 * This factory is used in Command Handlers when you need to:
 * - Load an existing User aggregate to modify it
 * - Execute business logic on the aggregate
 *
 * DO NOT use this factory in Query Handlers.
 * For queries, use IUserReadRepository which returns DTOs.
 *
 * @see IUserReadRepository for read-only operations
 * @see IUserWriteRepository for persistence operations
 */
export interface IUserFactory {
  /**
   * Loads a User aggregate by ID for modification.
   * Returns the aggregate with all business logic available.
   *
   * @param id - User ID
   * @returns User aggregate with business logic, or null if not found
   */
  loadById(id: string): Promise<User | null>;

  /**
   * Loads a User aggregate by email for modification.
   * Returns the aggregate with all business logic available.
   *
   * @param email - User email (case-insensitive)
   * @returns User aggregate with business logic, or null if not found
   */
  loadByEmail(email: string): Promise<User | null>;
}
