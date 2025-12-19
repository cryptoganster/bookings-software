/**
 * CustomersMerged Domain Event
 *
 * Published when two customer records are merged into one.
 * The source customer is marked as merged and all its data
 * is transferred to the target customer.
 *
 * This event can be used by other bounded contexts to:
 * - Update their own references to the merged customer
 * - Trigger notifications to business owners
 * - Update analytics and reporting
 *
 * @see .kiro/specs/customer-bc-enhancements/requirements.md - Requirement 5.6
 * @see .kiro/specs/customer-bc-enhancements/design.md - Section 2.3
 */
export class CustomersMerged {
  constructor(
    /**
     * ID of the customer that was merged (source)
     */
    public readonly sourceCustomerId: string,

    /**
     * ID of the customer that received the merge (target)
     */
    public readonly targetCustomerId: string,

    /**
     * ID of the user who performed the merge (business owner)
     */
    public readonly mergedBy: string,

    /**
     * Timestamp when the merge occurred
     */
    public readonly occurredAt: Date = new Date(),
  ) {}
}
