/**
 * ConversationReadModel
 *
 * Read model for conversation queries.
 *
 * **TODO: Implement when Conversation BC persistence is ready**
 *
 * **Requirements 8.5:** Add customerName field for display in admin panel
 *
 * This read model should include:
 * - id: string
 * - businessId: string
 * - customerId: string
 * - customerName: string | null  ← **NEW: Denormalized from Customer BC**
 * - customerPhone: string
 * - status: string
 * - lastMessageAt: Date
 * - createdAt: Date
 *
 * When implementing the read repository, JOIN with customers table:
 *
 * ```sql
 * SELECT
 *   c.*,
 *   cust.name as customer_name
 * FROM conversations c
 * LEFT JOIN customers cust ON cust.id = c.customer_id
 * WHERE c.id = :id
 * ```
 */
export class ConversationReadModel {
  constructor(
    public readonly id: string,
    public readonly businessId: string,
    public readonly customerId: string,
    public readonly customerName: string | null, // ← Denormalized from Customer
    public readonly customerPhone: string,
    public readonly status: string,
    public readonly lastMessageAt: Date,
    public readonly createdAt: Date,
  ) {}
}
