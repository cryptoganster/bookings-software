import { Conversation } from '@conversation/domain/aggregates/conversation';

/**
 * Write Repository interface for Conversation aggregate.
 *
 * Following CQRS strict compliance, this repository ONLY handles write operations.
 *
 * For loading aggregates to modify them, use IConversationFactory instead.
 * For querying conversation data, use IConversationReadRepository instead.
 *
 * @see IConversationFactory - For loading aggregates with business logic
 * @see IConversationReadRepository - For read-only queries
 */
export interface IConversationWriteRepository {
  /**
   * Persists a conversation aggregate.
   * Uses optimistic locking with version field.
   */
  save(conversation: Conversation): Promise<void>;

  // ❌ NO incluir métodos de lectura como:
  // findById(id: UUID): Promise<Conversation | null>;
  // findByCustomerIdAndBusinessId(customerId: UUID, businessId: UUID): Promise<Conversation | null>;
  //
  // ✅ Para cargar aggregates para modificarlos, usar IConversationFactory
  // ✅ Para queries de lectura, usar IConversationReadRepository
}
