import { CustomerReadModel } from '@customer/domain/read-models/customer';

/**
 * Domain Service Interface: CustomerExistenceChecker
 *
 * Validates customer existence in Customer BC.
 *
 * This service encapsulates read operations for validation purposes,
 * allowing command handlers to maintain CQRS strict separation by
 * not directly injecting read repositories.
 *
 * Used by:
 * - Booking BC: CreateAppointmentHandler validates customer exists
 * - Customer BC: DeleteCustomerHandler validates customer exists
 *
 * @see .kiro/steering/ddd-patterns.md - Domain Services section
 */
export interface ICustomerExistenceChecker {
  /**
   * Checks if a customer exists
   *
   * @param customerId - Customer ID to check
   * @returns true if exists, false otherwise
   */
  exists(customerId: string): Promise<boolean>;

  /**
   * Gets customer data if exists
   *
   * @param customerId - Customer ID to retrieve
   * @returns CustomerReadModel if found, null otherwise
   */
  getCustomer(customerId: string): Promise<CustomerReadModel | null>;
}
