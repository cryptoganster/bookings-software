import { Customer } from '../../aggregates/customer';

/**
 * Write Repository Interface for Customer Aggregate
 * 
 * Following CQRS strict separation:
 * - Only write operations (save)
 * - No read operations (use ICustomerFactory for loading aggregates)
 * - Implements optimistic locking with version field
 */
export interface ICustomerWriteRepository {
  /**
   * Persists a customer aggregate
   * Uses optimistic locking with version field
   * 
   * @throws ConcurrencyException if version mismatch
   */
  save(customer: Customer): Promise<void>;
}
