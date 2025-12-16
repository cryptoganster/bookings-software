import { Conversation } from '../../aggregates/conversation';
import { UUID } from '@shared/vo/uuid';

/**
 * Factory interface for loading Conversation aggregates.
 *
 * This factory reconstructs Conversation aggregates from persistence
 * with all business logic intact, including version for optimistic locking.
 *
 * Used by Command Handlers when they need to modify existing conversations.
 *
 * @see IConversationWriteRepository - For persisting conversations (write-only)
 * @see IConversationReadRepository - For querying conversation data (read-only)
 */
export interface IConversationFactory {
  /**
   * Loads a Conversation aggregate by its ID for modification.
   *
   * @param id - The conversation UUID
   * @returns The Conversation aggregate with business logic, or null if not found
   */
  loadById(id: UUID): Promise<Conversation | null>;

  /**
   * Loads a Conversation aggregate by customer and business IDs.
   *
   * @param customerId - The customer UUID
   * @param businessId - The business UUID
   * @returns The Conversation aggregate with business logic, or null if not found
   */
  loadByCustomerIdAndBusinessId(customerId: UUID, businessId: UUID): Promise<Conversation | null>;
}
