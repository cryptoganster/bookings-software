/**
 * BusinessOwnerCreated Domain Event
 * Se publica cuando se crea un nuevo BusinessOwner
 */
export class BusinessOwnerCreated {
  constructor(
    public readonly businessOwnerId: string,
    public readonly userId: string,
    public readonly subscriptionPlan: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
