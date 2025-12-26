/**
 * ConversationReadModel
 *
 * Modelo de lectura para conversaciones.
 * Usado en queries para mostrar conversaciones pendientes y detalles.
 *
 * @remarks
 * - customerName: Denormalizado desde Customer BC para evitar joins en frontend
 * - lastMessageAt: Timestamp del último mensaje para ordenamiento
 * - status: 'ACTIVE' | 'AWAITING_ADMIN' | 'RESOLVED'
 * - Todos los campos Date son serializados como ISO 8601 strings en la API
 *
 * **Implementation Note:**
 * El read repository debe hacer JOIN con customers table:
 *
 * ```sql
 * SELECT
 *   c.*,
 *   cust.name as customer_name,
 *   cust.whatsapp_phone as customer_phone
 * FROM conversations c
 * LEFT JOIN customers cust ON cust.id = c.customer_id
 * WHERE c.business_id = :businessId
 * ORDER BY c.last_message_at DESC
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
