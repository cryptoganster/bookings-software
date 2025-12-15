import { Conversation } from '../../aggregates/conversation';
import { UUID } from '@shared/vo/uuid';

export interface IConversationWriteRepository {
  save(conversation: Conversation): Promise<void>;
  findById(id: UUID): Promise<Conversation | null>;
  findByCustomerIdAndBusinessId(customerId: UUID, businessId: UUID): Promise<Conversation | null>;
}
