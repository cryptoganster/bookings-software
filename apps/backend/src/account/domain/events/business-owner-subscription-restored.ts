/**
 * BusinessOwnerSubscriptionRestored Domain Event
 * Se publica cuando se restaura la suscripción de un BusinessOwner
 */
export class BusinessOwnerSubscriptionRestored {
  constructor(
    public readonly businessOwnerId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
