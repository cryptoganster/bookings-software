/**
 * BusinessOwnerSubscriptionSuspended Domain Event
 * Se publica cuando se suspende la suscripción de un BusinessOwner
 */
export class BusinessOwnerSubscriptionSuspended {
  constructor(
    public readonly businessOwnerId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
