/**
 * Domain Service Interface: BusinessLimitChecker
 *
 * Purpose: Validates business creation limits based on subscription plan
 *
 * This service encapsulates the logic for checking if a business owner
 * can create additional businesses based on their subscription plan limits.
 * It's used by command handlers to validate limits without violating CQRS.
 *
 * Usage:
 * - CreateBusinessHandler: Validate limit before creating new business
 *
 * @see BusinessLimitChecker for implementation
 */
export interface IBusinessLimitChecker {
  /**
   * Checks if a business owner can create a new business
   *
   * @param ownerId - User ID of the business owner
   * @returns true if owner can create business, false if limit reached
   * @throws BusinessOwnerNotFoundException if owner not found
   *
   * @example
   * const canCreate = await checker.canCreateBusiness('owner-123');
   * if (!canCreate) {
   *   const current = await checker.getBusinessCount('owner-123');
   *   const max = await checker.getMaxBusinessesAllowed('owner-123');
   *   throw new BusinessLimitExceededException(current, max);
   * }
   */
  canCreateBusiness(ownerId: string): Promise<boolean>;

  /**
   * Gets the current number of businesses owned by a user
   *
   * @param ownerId - User ID of the business owner
   * @returns Number of businesses currently owned
   */
  getBusinessCount(ownerId: string): Promise<number>;

  /**
   * Gets the maximum number of businesses allowed for a user
   * based on their subscription plan
   *
   * @param ownerId - User ID of the business owner
   * @returns Maximum businesses allowed by subscription plan
   * @throws BusinessOwnerNotFoundException if owner not found
   */
  getMaxBusinessesAllowed(ownerId: string): Promise<number>;
}
