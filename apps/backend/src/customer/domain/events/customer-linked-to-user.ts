/**
 * Domain Event: CustomerLinkedToUser
 *
 * Published when an anonymous customer is linked to a registered user
 *
 * This event is used by:
 * - Auth BC to add CUSTOMER role to the user
 * - Read models to update customer registration status
 * - Analytics to track customer registration conversions
 */
export class CustomerLinkedToUser {
  constructor(
    public readonly customerId: string,
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
