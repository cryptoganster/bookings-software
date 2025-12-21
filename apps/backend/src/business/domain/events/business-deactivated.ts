/**
 * BusinessDeactivated Domain Event
 *
 * Published when a business is deactivated
 */
export class BusinessDeactivated {
  constructor(
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
