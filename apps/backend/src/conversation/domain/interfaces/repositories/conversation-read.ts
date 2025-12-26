import { ConversationReadModel } from '@conversation/domain/read-models/conversation';

/**
 * Read Repository interface for Conversation queries.
 *
 * Following CQRS strict compliance, this repository ONLY handles read operations.
 * Returns ConversationReadModel (DTOs) for display purposes.
 *
 * @see IConversationWriteRepository - For write operations
 * @see IConversationFactory - For loading aggregates with business logic
 */
export interface IConversationReadRepository {
  /**
   * Find conversation by ID
   * @returns ConversationReadModel with denormalized customer data
   */
  findById(id: string): Promise<ConversationReadModel | null>;

  /**
   * Find all conversations pending admin response for a business
   * @param businessId - Business ID
   * @returns Array of conversations with status 'AWAITING_ADMIN'
   */
  findPendingByBusinessId(businessId: string): Promise<ConversationReadModel[]>;

  /**
   * Find all conversations for a business
   * @param businessId - Business ID
   * @returns Array of all conversations ordered by lastMessageAt DESC
   */
  findByBusinessId(businessId: string): Promise<ConversationReadModel[]>;
}
