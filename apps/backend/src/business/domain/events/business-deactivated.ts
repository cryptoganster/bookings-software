/**
 * BusinessDeactivated Domain Event
 *
 * Published when a business is deactivated.
 *
 * Requirements: 6.3
 */
export class BusinessDeactivated {
  constructor(
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
