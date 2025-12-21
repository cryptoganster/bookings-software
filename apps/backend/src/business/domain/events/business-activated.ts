/**
 * BusinessActivated Domain Event
 *
 * Published when a business is activated.
 *
 * Requirements: 6.5
 */
export class BusinessActivated {
  constructor(
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
