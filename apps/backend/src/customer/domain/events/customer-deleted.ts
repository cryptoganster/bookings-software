/**
 * Domain Event: CustomerDeleted
 *
 * Published when a customer is deleted (GDPR compliance).
 * Customer data is anonymized while preserving referential integrity.
 */
export class CustomerDeleted {
  constructor(
    public readonly customerId: string,
    public readonly deletedBy: string, // userId of business owner
    public readonly occurredAt: Date = new Date(),
  ) {}
}
