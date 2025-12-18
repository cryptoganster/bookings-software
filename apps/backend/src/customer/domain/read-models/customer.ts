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
  id: string;
  userId: string | null; // ← null = anonymous, UUID = registered
  businessId: string;
  whatsappPhone: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}
