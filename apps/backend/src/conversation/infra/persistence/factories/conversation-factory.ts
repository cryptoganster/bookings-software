import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '@conversation/domain/aggregates/conversation';
import { IConversationFactory } from '@conversation/domain/interfaces/factories/conversation-factory';
import { UUID } from '@shared/vo/uuid';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
import { ConversationWriteMapper } from '@conversation/infra/persistence/mappers/conversation-write.mapper';

/**
 * ConversationFactory
 *
 * Factory implementation for loading Conversation aggregates from database.
 * Uses TypeORM Repository and ConversationWriteMapper for reconstruction.
 *
 * @remarks
 * - Loads aggregates with business logic for modification
 * - Preserves version for optimistic locking
 * - Returns null if conversation not found
 * - Used by command handlers to load existing conversations
 */
@Injectable()
export class ConversationFactory implements IConversationFactory {
  constructor(
    @InjectRepository(ConversationModel)
    private readonly repository: Repository<ConversationModel>,
  ) {}

  /**
   * Loads a conversation by ID
   *
   * @param id - UUID of the conversation
   * @returns Conversation aggregate or null if not found
   */
  async loadById(id: UUID): Promise<Conversation | null> {
    const model = await this.repository.findOne({
      where: { id: id.getValue() },
    });

    if (!model) {
      return null;
    }

    return ConversationWriteMapper.toDomain(model);
  }

  /**
   * Loads a conversation by customer and business
   *
   * @param customerId - UUID of the customer
   * @param businessId - UUID of the business
   * @returns Conversation aggregate or null if not found
   */
  async loadByCustomerIdAndBusinessId(
    customerId: UUID,
    businessId: UUID,
  ): Promise<Conversation | null> {
    const model = await this.repository.findOne({
      where: {
        customerId: customerId.getValue(),
        businessId: businessId.getValue(),
      },
    });

    if (!model) {
      return null;
    }

    return ConversationWriteMapper.toDomain(model);
  }
}
