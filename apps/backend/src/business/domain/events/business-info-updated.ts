/**
 * BusinessInfoUpdated Domain Event
 *
 * Published when business information is updated.
 *
 * Requirements: 3.3
 */
export class BusinessInfoUpdated {
  constructor(
    public readonly businessId: string,
    public readonly name: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
