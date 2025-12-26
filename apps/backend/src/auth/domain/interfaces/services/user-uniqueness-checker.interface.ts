/**
 * IUserUniquenessChecker
 *
 * Domain Service interface for validating User email uniqueness.
 *
 * Purpose:
 * Encapsulates read operations for uniqueness validation, allowing
 * command handlers to maintain CQRS strict separation by not directly
 * injecting read repositories.
 *
 * Usage:
 * - RegisterHandler: Validate email before creating new user
 *
 * @see UserUniquenessChecker for implementation
 */
export interface IUserUniquenessChecker {
  /**
   * Checks if an email is unique in the system
   *
   * @param email - Email address to check
   * @returns true if email is unique, false if already exists
   */
  isEmailUnique(email: string): Promise<boolean>;
}
