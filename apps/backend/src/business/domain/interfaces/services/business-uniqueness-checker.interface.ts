/**
 * Domain Service Interface: BusinessUniquenessChecker
 *
 * Purpose: Validates uniqueness of WhatsApp phone numbers in Business BC
 *
 * This service encapsulates the logic for checking if a WhatsApp phone number
 * is already in use by another business. It's used by command handlers to
 * validate uniqueness without violating CQRS strict separation.
 *
 * Usage:
 * - CreateBusinessHandler: Validate phone before creating new business
 * - ConfigureWhatsAppHandler: Validate phone before updating business WhatsApp
 *
 * @see BusinessUniquenessChecker for implementation
 */
export interface IBusinessUniquenessChecker {
  /**
   * Checks if a WhatsApp phone number is unique (not used by any business)
   *
   * @param phone - WhatsApp phone number to check (e.g., '+18095551234')
   * @param excludeBusinessId - Optional business ID to exclude from check (for updates)
   * @returns true if phone is unique, false if already exists
   *
   * @example
   * // Creating new business
   * const isUnique = await checker.isWhatsAppPhoneUnique('+18095551234');
   * if (!isUnique) {
   *   throw new WhatsAppPhoneAlreadyExistsException('+18095551234');
   * }
   *
   * @example
   * // Updating existing business (exclude current business from check)
   * const isUnique = await checker.isWhatsAppPhoneUnique('+18095551234', 'business-123');
   * if (!isUnique) {
   *   throw new WhatsAppPhoneAlreadyExistsException('+18095551234');
   * }
   */
  isWhatsAppPhoneUnique(phone: string, excludeBusinessId?: string): Promise<boolean>;
}
