/**
 * Domain Event: CustomerNameUpdated
 *
 * Published when a customer's name is updated
 *
 * This event is used by:
 * - Read models to update customer information
 * - Booking BC to refresh appointment display names
 */
export class CustomerNameUpdated {
  constructor(
    public readonly customerId: string,
    public readonly newName: string,
    public readonly previousName: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
