import { Command } from '@nestjs/cqrs';

/**
 * MergeCustomersCommand
 *
 * Merges two customer records into one, consolidating all related data.
 * The source customer is soft-deleted (marked as merged) and all its
 * appointments and conversations are transferred to the target customer.
 *
 * Business Rules:
 * - Both customers must belong to the same business
 * - Source and target must be different customers
 * - Source customer is marked as merged (soft delete)
 * - All appointments are transferred to target
 * - All conversations are transferred to target
 * - Operation is atomic (transaction)
 * - Uses optimistic locking to prevent concurrent modifications
 *
 * @see .kiro/specs/customer-bc-enhancements/requirements.md - Requirement 5
 * @see .kiro/specs/customer-bc-enhancements/design.md - Section 2.1
 */
export class MergeCustomersCommand extends Command<void> {
  constructor(
    /**
     * ID of the customer to be merged (will be marked as merged)
     */
    public readonly sourceCustomerId: string,

    /**
     * ID of the customer to merge into (will receive all data)
     */
    public readonly targetCustomerId: string,

    /**
     * ID of the user performing the merge (business owner)
     * Used for audit trail
     */
    public readonly mergedBy: string,
  ) {
    super();
  }
}
