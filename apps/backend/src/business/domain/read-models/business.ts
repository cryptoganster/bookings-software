/**
 * BusinessReadModel
 *
 * Read model for Business queries (CQRS read side)
 * Optimized for display and querying
 */
export class BusinessReadModel {
  constructor(
    public readonly id: string,
    public readonly ownerId: string,
    public readonly name: string,
    public readonly whatsappPhone: string,
    public readonly addressStreet: string,
    public readonly addressCity: string,
    public readonly addressState: string | null,
    public readonly addressCountry: string | null,
    public readonly addressPostalCode: string | null,
    public readonly timezone: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly version: number,
  ) {}
}
