import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * CustomersFromDifferentBusinessesException
 *
 * Thrown when attempting to merge customers from different businesses.
 * Customers can only be merged within the same business context.
 *
 * @see .kiro/specs/customer-bc-enhancements/requirements.md - Requirement 5.1
 */
export class CustomersFromDifferentBusinessesException extends DomainException {
  constructor(sourceCustomerId: string, targetCustomerId: string) {
    super(
      `Cannot merge customers ${sourceCustomerId} and ${targetCustomerId}: they belong to different businesses.`,
    );
  }
}
