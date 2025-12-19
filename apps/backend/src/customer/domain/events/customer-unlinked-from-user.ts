/**
 * Domain Event: CustomerUnlinkedFromUser
 *
 * Published when a registered customer is unlinked from a user
 * (customer becomes anonymous again)
 *
 * This event is used by:
 * - Auth BC to potentially remove CUSTOMER role from the user
 * - Read models to update customer registration status
 * - Analytics to track customer churn
 */
export class CustomerUnlinkedFromUser {
  constructor(
    public readonly customerId: string,
    public readonly previousUserId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
