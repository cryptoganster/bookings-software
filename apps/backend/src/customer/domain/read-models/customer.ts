/**
 * CustomerReadModel
 *
 * Read model optimized for queries.
 * Contains denormalized data for efficient reads.
 *
 * Used by:
 * - Query handlers to return customer data
 * - Booking BC to display customer info in appointments
 * - Conversation BC to display customer info in conversations
 */
export class CustomerReadModel {
  constructor(
    public readonly id: string,
    public readonly userId: string | null, // ← null = anonymous, UUID = registered
    public readonly businessId: string,
    public readonly whatsappPhone: string,
    public readonly name: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
