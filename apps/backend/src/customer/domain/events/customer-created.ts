/**
 * Domain Event: CustomerCreated
 * 
 * Published when a new customer is created (anonymous or registered)
 * 
 * This event is used by:
 * - Conversation BC to track customer interactions
 * - Booking BC to associate appointments with customers
 */
export class CustomerCreated {
  constructor(
    public readonly customerId: string,
    public readonly businessId: string,
    public readonly whatsappPhone: string,
    public readonly name: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
