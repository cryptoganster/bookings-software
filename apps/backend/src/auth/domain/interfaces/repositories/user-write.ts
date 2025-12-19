import { User } from '@auth/domain/aggregates/user';

/**
 * Write Repository for User aggregate.
 *
 * CQRS STRICT COMPLIANCE:
 * This repository ONLY handles WRITE operations (save, delete).
 *
 * For READING aggregates to modify them, use IUserFactory.
 * For QUERYING data to display, use IUserReadRepository.
 *
 * @see IUserFactory - Load aggregates for modification
 * @see IUserReadRepository - Query data for display
 */
export interface IUserWriteRepository {
  /**
   * Persists a User aggregate.
   * Uses optimistic locking with version field.
   */
  save(user: User): Promise<void>;

  // ❌ NO read methods like findById() or findByEmail()
  // ✅ Use IUserFactory to load aggregates for modification
}
