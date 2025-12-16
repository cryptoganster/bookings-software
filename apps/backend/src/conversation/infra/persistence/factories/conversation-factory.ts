import { Injectable } from '@nestjs/common';
import { IConversationFactory } from '@conversation/domain/interfaces/factories/conversation-factory';
import { Conversation } from '@conversation/domain/aggregates/conversation';
import { UUID } from '@shared/vo/uuid';

/**
 * Factory implementation for loading Conversation aggregates.
 *
 * NOTE: This is a temporary implementation that works with the mock in-memory store.
 * When real persistence is implemented with TypeORM, this factory should be updated to:
 * 1. Inject Repository<ConversationModel>
 * 2. Use ConversationWriteMapper.toDomain() to reconstruct aggregates
 * 3. Preserve version for optimistic locking
 *
 * Current implementation uses the mock conversationsStore from ConversationModule.
 */
@Injectable()
export class ConversationFactory implements IConversationFactory {
  constructor() {
    // When real persistence is implemented, inject:
    // @InjectRepository(ConversationModel)
    // private readonly repository: Repository<ConversationModel>,
  }

  async loadById(_id: UUID): Promise<Conversation | null> {
    // TODO: Implement when real persistence layer exists
    // const model = await this.repository.findOne({ where: { id: _id.getValue() } });
    // if (!model) return null;
    // return ConversationWriteMapper.toDomain(model);

    // For now, return null as mock store doesn't support findById
    return null;
  }

  async loadByCustomerIdAndBusinessId(
    _customerId: UUID,
    _businessId: UUID,
  ): Promise<Conversation | null> {
    // TODO: Implement when real persistence layer exists
    // const model = await this.repository.findOne({
    //   where: {
    //     customerId: _customerId.getValue(),
    //     businessId: _businessId.getValue(),
    //   },
    // });
    // if (!model) return null;
    // return ConversationWriteMapper.toDomain(model);

    // For now, return null as this will be handled by the mock repository
    // The mock repository is injected directly in the handler for now
    return null;
  }
}
