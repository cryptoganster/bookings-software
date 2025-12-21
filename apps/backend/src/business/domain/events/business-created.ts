/**
 * BusinessCreated Domain Event
 *
 * Published when a new business is created.
 *
 * Requirements: 1.5
 */
export class BusinessCreated {
  constructor(
    public readonly businessId: string,
    public readonly ownerId: string,
    public readonly name: string,
    public readonly whatsappPhone: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
