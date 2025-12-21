/**
 * BusinessOwnerSubscriptionUpgraded Domain Event
 * Se publica cuando un BusinessOwner mejora su plan de suscripción
 */
export class BusinessOwnerSubscriptionUpgraded {
  constructor(
    public readonly businessOwnerId: string,
    public readonly oldPlan: string,
    public readonly newPlan: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
