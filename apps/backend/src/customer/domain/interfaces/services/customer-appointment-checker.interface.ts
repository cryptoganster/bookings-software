/**
 * Domain Service Interface: CustomerAppointmentChecker
 *
 * Validates customer appointment status in Customer BC.
 *
 * This service encapsulates cross-BC read operations for validation purposes,
 * allowing command handlers to maintain CQRS strict separation and avoid
 * direct cross-BC dependencies.
 *
 * Used by:
 * - Customer BC: DeleteCustomerHandler validates no future appointments
 *
 * Cross-BC Dependency:
 * - Depends on IAppointmentReadRepository from Booking BC (via interface only)
 * - This is acceptable as it's a domain service depending on domain interface
 *
 * @see .kiro/steering/ddd-patterns.md - Domain Services section
 * @see .kiro/steering/architecture-boundaries.md - Cross-BC dependencies
 */
export interface ICustomerAppointmentChecker {
  /**
   * Checks if customer has future appointments
   *
   * Future appointments are:
   * - Status: CONFIRMED (not CANCELLED or COMPLETED)
   * - DateTime: In the future (> now)
   *
   * @param customerId - Customer ID to check
   * @returns true if has future appointments, false otherwise
   */
  hasFutureAppointments(customerId: string): Promise<boolean>;

  /**
   * Gets count of future appointments for customer
   *
   * @param customerId - Customer ID to check
   * @returns Number of future appointments
   */
  getFutureAppointmentsCount(customerId: string): Promise<number>;
}
