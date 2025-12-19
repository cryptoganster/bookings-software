import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * CannotMergeCustomerWithItselfException
 *
 * Thrown when attempting to merge a customer with itself.
 * Source and target customer IDs must be different.
 *
 * @see .kiro/specs/customer-bc-enhancements/requirements.md - Edge Case 1
 */
export class CannotMergeCustomerWithItselfException extends DomainException {
  constructor(customerId: string) {
    super(`Cannot merge customer ${customerId} with itself. Source and target must be different.`);
  }
}
